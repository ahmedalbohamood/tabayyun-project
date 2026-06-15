import base64
import json
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI

from app.config.settings import settings
from app.services.rag_service import search


llm = ChatOpenAI(
    model=settings.MODEL_NAME,
    api_key=settings.OPENAI_API_KEY,
    temperature=0
)


def extract_file_content(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        return "\n".join(page.page_content for page in pages)

    if ext in [".jpg", ".jpeg", ".png"]:
        with open(file_path, "rb") as file:
            image_data = base64.b64encode(file.read()).decode("utf-8")

        response = llm.invoke([
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "صف محتوى هذه الصورة بالتفصيل واستخرج أي نصوص أو أرقام أو تواريخ أو مبالغ ظاهرة فيها."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/{ext[1:]};base64,{image_data}"
                        }
                    }
                ]
            }
        ])
        return response.content

    return ""


SYSTEM_PROMPT = """
## السياق القانوني

ستتلقى تعريفات قانونية ذات صلة مستخرجة من وثائق رسمية.

استخدم هذه التعريفات لـ:
- تحديد نوع الشبهة بدقة
- إضافة حقل legal_basis يذكر النص القانوني أو التعريف الأقرب
- تقوية readiness_reasoning بالمرجع القانوني عند وجود تطابق واضح

إذا لم يتطابق البلاغ مع أي تعريف قانوني واضح، اكتب في legal_basis:
"لا يوجد تطابق قانوني واضح بناءً على المعلومات المتاحة"

أنت محلل متخصص في فرز بلاغات الفساد لهيئة مكافحة الفساد.

مهمتك:
تحليل نص البلاغ واستخراج المعلومات المهمة منه وإخراج تقييم منظم بصيغة JSON فقط، بدون أي نص إضافي قبل أو بعد JSON.

## الهدف

النظام لا يحدد إن كان البلاغ صحيحاً أو كاذباً.

النظام يقيم:
- مدى جاهزية البلاغ للتحقيق
- مستوى اكتمال المعلومات
- وجود عناصر قابلة للتحقق
- نوع الشبهة المحتملة

## معايير رفع درجة الجاهزية للتحقيق readiness_score

- وجود تواريخ محددة
- وجود جهات حكومية أو مؤسسات محددة
- وجود أسماء أشخاص أو مناصب
- وجود أرقام أو مبالغ مالية
- وجود أرقام عقود أو معاملات
- وجود أدلة داعمة مثل مستندات أو رسائل أو صور أو شهود
- تسلسل منطقي وواضح للأحداث

## معايير خفض درجة الجاهزية

- معلومات عامة وغير محددة
- لغة عاطفية أو اتهامية فقط
- غياب التواريخ والأسماء والجهات
- عدم وجود أي عنصر قابل للتحقق
- تناقضات داخلية في القصة

## التصنيفات الممكنة لـ suspicion_type

رشوة
اختلاس
تزوير
استغلال نفوذ
تضارب مصالح
غير واضح

## قواعد الأولوية priority

عالية:
- readiness_score >= 70
- والتصنيف ليس "غير واضح"

متوسطة:
- readiness_score بين 40 و 69

منخفضة:
- readiness_score أقل من 40

## المستند المرفق

ستتلقى دائماً قسماً بعنوان "محتوى المستند المرفق".

إذا كان المستند موجوداً:
- صف محتواه في document_assessment
- استخرج منه الأدلة وأضفها في extracted_evidence
- ارفع readiness_score إذا كان المستند يدعم البلاغ فعلاً
- اذكر في readiness_reasoning كيف أثّر المستند على الدرجة

إذا كان النص "لم يتم إرفاق أي مستند داعم مع هذا البلاغ.":
- اكتب في document_assessment "لا يوجد مستند مرفق"
- اذكر أن غياب المستندات قد يقلل جاهزية التحقيق، دون افتراض أن البلاغ غير صحيح

## المخرجات

أخرج JSON فقط بهذا الشكل:

{
  "readiness_score": 0,
  "readiness_reasoning": "",
  "suspicion_type": "",
  "legal_basis": "",
  "priority": "",
  "analysis_summary": "",
  "extracted_evidence": [],
  "mentioned_entities": [],
  "mentioned_people": [],
  "important_dates": [],
  "financial_amounts": [],
  "contract_numbers": [],
  "priority_reasons": [],
  "missing_info": [],
  "document_assessment": "",
  "system_recommendation": ""
}
"""


def default_analysis() -> dict:
    return {
        "readiness_score": 0,
        "readiness_reasoning": "تعذر تحليل البلاغ بصيغة منظمة.",
        "suspicion_type": "غير واضح",
        "legal_basis": "لا يوجد تطابق قانوني واضح بناءً على المعلومات المتاحة",
        "priority": "منخفضة",
        "analysis_summary": "لم يتمكن النظام من استخراج تحليل واضح من البلاغ.",
        "extracted_evidence": [],
        "mentioned_entities": [],
        "mentioned_people": [],
        "important_dates": [],
        "financial_amounts": [],
        "contract_numbers": [],
        "priority_reasons": [],
        "missing_info": ["تعذر قراءة نتيجة الذكاء الاصطناعي"],
        "document_assessment": "غير متاح",
        "system_recommendation": "معالجة روتينية"
    }


def clean_json_response(content: str) -> str:
    content = content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")

    return content.strip()


def analyze_report(report_text: str, file_content: str = "") -> dict:
    try:
        legal_context = search(report_text)
    except Exception:
        legal_context = "لا توجد تعريفات قانونية مسترجعة."

    full_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"التعريفات القانونية ذات الصلة:\n{legal_context}\n\n"
        f"نص البلاغ:\n{report_text}\n\n"
        f"محتوى المستند المرفق:\n{file_content or 'لم يتم إرفاق أي مستند داعم مع هذا البلاغ.'}"
    )

    try:
        response = llm.invoke(full_prompt)
        content = clean_json_response(response.content)
        return json.loads(content)
    except Exception:
        return default_analysis()