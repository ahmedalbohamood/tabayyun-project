import json
import base64
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader
from app.services.rag_service import search

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


def extract_file_content(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        return "\n".join(p.page_content for p in pages)

    elif ext in [".jpg", ".jpeg", ".png"]:
        with open(file_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
        response = llm.invoke([{
            "role": "user",
            "content": [
                {"type": "text", "text": "صف محتوى هذه الصورة بالتفصيل"},
                {"type": "image_url", "image_url": {"url": f"data:image/{ext[1:]};base64,{image_data}"}}
            ]
        }])
        return response.content

    return ""

SYSTEM_PROMPT = """## السياق القانوني
ستتلقى تعريفات قانونية ذات صلة مستخرجة من وثائق رسمية.
استخدم هذه التعريفات لـ:
- تحديد نوع الشبهة بدقة
- إضافة حقل legal_basis يذكر النص القانوني المطابق
- تقوية readiness_reasoning بالمرجع القانوني
إذا لم يتطابق البلاغ مع أي تعريف قانوني واضح، اذكر ذلك في legal_basis.
 
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
 
## معايير رفع درجة الجاهزية للتحقيق (readiness_score)
 
- وجود تواريخ محددة
- وجود جهات حكومية أو مؤسسات محددة
- وجود أسماء أشخاص أو مناصب
- وجود أرقام أو مبالغ مالية
- وجود أرقام عقود أو معاملات
- وجود أدلة داعمة (مستندات، رسائل، صور، شهود)
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
 
## قواعد الأولوية (priority)
 
عالية:
- readiness_score >= 70
- والتصنيف ليس "غير واضح"
 
متوسطة:
- readiness_score بين 40 و 69
 
منخفضة:
- readiness_score أقل من 40
 
## استخراج المعلومات
 
استخرج إن وجدت:
- الجهات الحكومية
- أسماء الأشخاص
- المبالغ المالية
- أرقام العقود أو المعاملات
- التواريخ المهمة
- الأدلة المذكورة
 
## أسباب رفع الأولوية
 
استخرج فقط الأسباب الحقيقية الموجودة داخل البلاغ.
 
أمثلة:
- يحتوي على مبالغ مالية محددة
- يحتوي على تواريخ دقيقة
- يحتوي على أدلة داعمة
- يحتوي على جهة محددة
- يحتوي على أسماء أشخاص
- يحتوي على رقم عقد أو معاملة
 
## المستند المرفق
ستتلقى دائماً قسماً بعنوان "محتوى المستند المرفق".
- إذا كان المستند موجوداً:
  * صف محتواه بالتفصيل في document_assessment
  * استخرج منه الأدلة وأضفها في extracted_evidence
  * ارفع readiness_score بمقدار 10 إلى 20 نقطة إضافية إن كان يدعم البلاغ
  * اذكر في readiness_reasoning تحديداً كيف أثّر المستند على الدرجة
- إذا كان النص "لم يتم إرفاق أي مستند داعم":
  * اكتب في document_assessment "لا يوجد مستند مرفق"
  * خفّض readiness_score بسبب غياب الأدلة الموثقة

## المخرجات

أخرج JSON فقط بهذا الشكل:
 
{
  "readiness_score": <رقم من 0 إلى 100>,
  "readiness_reasoning": "<شرح مختصر لسبب الدرجة>",
  "suspicion_type": "<رشوة | اختلاس | تزوير | استغلال نفوذ | تضارب مصالح | غير واضح>",
  "legal_basis": "<النص أو التعريف القانوني المطابق، أو 'لا يوجد تطابق واضح' إن لم يوجد>",
  "priority": "<عالية | متوسطة | منخفضة>",
  "analysis_summary": "<ملخص احترافي من 2 إلى 4 أسطر يصف محتوى البلاغ>",
  "extracted_evidence": ["<دليل 1>", "<دليل 2>"],
  "mentioned_entities": ["<جهة>"],
  "mentioned_people": ["<شخص>"],
  "important_dates": ["<تاريخ>"],
  "financial_amounts": ["<مبلغ>"],
  "contract_numbers": ["<رقم عقد أو معاملة>"],
  "priority_reasons": ["<سبب>"],
  "missing_info": ["<معلومة ناقصة>"],
  "document_assessment": "<وصف تفصيلي لمحتوى المستند المرفق وما يحتويه من أدلة، وكيف أثّر على درجة الجاهزية. أو 'لا يوجد مستند مرفق' إن لم يُرفق شيء>",
  "system_recommendation": "<يتطلب تحقيقاً عاجلاً | قيد المراجعة | معالجة روتينية>"
}
"""

def analyze_report(report_text: str, file_content: str = "") -> dict:
    legal_context = search(report_text)
    
    full_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"التعريفات القانونية ذات الصلة:\n{legal_context}\n\n"
        f"نص البلاغ:\n{report_text}"
    )
    
    if file_content:
        full_prompt += f"\n\nمحتوى المستند المرفق:\n{file_content}"
    
    response = llm.invoke(full_prompt)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())