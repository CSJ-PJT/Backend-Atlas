from __future__ import annotations

import json
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "backend-study"
OUTPUT = ROOT / "docs" / "backend-study" / "Backend-Atlas-백엔드-실무-학습-32일.pdf"


def load(name: str):
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


curriculum = load("curriculum")
practices = {item["id"]: item for item in load("practice-bank")["practices"]}
questions = {item["id"]: item for item in load("question-bank")["questions"]}
sources = {item["id"]: item for item in load("source-manifest")["sources"]}

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("Malgun-Bold", r"C:\Windows\Fonts\malgunbd.ttf"))

NAVY = colors.HexColor("#071A2F")
BLUE = colors.HexColor("#1766D2")
CYAN = colors.HexColor("#00A6A6")
PALE = colors.HexColor("#E9F3FF")
MINT = colors.HexColor("#DCF7EF")
INK = colors.HexColor("#14243A")
MUTED = colors.HexColor("#5C6C80")
LINE = colors.HexColor("#D7E0EB")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="KBody", fontName="Malgun", fontSize=9.2, leading=15, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="KSmall", parent=styles["KBody"], fontSize=7.8, leading=11.5, textColor=MUTED))
styles.add(ParagraphStyle(name="KTitle", fontName="Malgun-Bold", fontSize=28, leading=36, textColor=NAVY, spaceAfter=9))
styles.add(ParagraphStyle(name="KChapter", fontName="Malgun-Bold", fontSize=20, leading=28, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="KDay", fontName="Malgun-Bold", fontSize=17, leading=24, textColor=NAVY, spaceAfter=7))
styles.add(ParagraphStyle(name="KH2", fontName="Malgun-Bold", fontSize=12, leading=18, textColor=BLUE, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name="KH3", fontName="Malgun-Bold", fontSize=9.5, leading=14, textColor=NAVY, spaceBefore=5, spaceAfter=3))
styles.add(ParagraphStyle(name="KCover", fontName="Malgun-Bold", fontSize=34, leading=44, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="KCoverSub", fontName="Malgun", fontSize=12, leading=20, textColor=colors.HexColor("#D6E5F2")))
styles.add(ParagraphStyle(name="KCenter", parent=styles["KBody"], alignment=TA_CENTER))


def p(text, style="KBody"):
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), styles[style])


def bullets(values):
    result = []
    for value in values or []:
        result.append(Paragraph(f"• {escape(str(value))}", styles["KBody"]))
    return result


def heading(title):
    return [Paragraph(escape(title), styles["KH2"]), HRFlowable(width="100%", thickness=.7, color=LINE, spaceAfter=5)]


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Malgun", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9 * mm, "Backend Atlas · 백엔드 실무 학습 · canonical source build")
    canvas.drawRightString(192 * mm, 9 * mm, str(doc.page))
    canvas.restoreState()


class StudyDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=17 * mm, bottomMargin=18 * mm, title="Backend Atlas 백엔드 실무 학습 32일")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="study", frames=frame, onPage=page_footer))


story = []
cover = Table([[Paragraph("BACKEND ATLAS", styles["KH2"])], [Paragraph("백엔드 실무 학습", styles["KCover"])], [Paragraph("원리를 이해하고, 실패를 재현하고, 증거로 검증하는 21챕터 · 32일 학습 시스템", styles["KCoverSub"])]], colWidths=[174 * mm], rowHeights=[18 * mm, 58 * mm, 38 * mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 14 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
    ("BOX", (0, 0), (-1, -1), 0, NAVY),
]))
story.extend([Spacer(1, 26 * mm), cover, Spacer(1, 18 * mm), p("이 문서는 웹 학습 페이지와 동일한 구조화 JSON에서 생성됩니다. 읽기만 하지 말고 각 DAY의 실습·실패 주입·검증·회상 평가를 직접 수행하세요.", "KBody"), PageBreak()])

story.append(Paragraph("32일 로드맵", styles["KTitle"]))
chapter_rows = [[p("챕터", "KSmall"), p("주제", "KSmall"), p("DAY", "KSmall")]]
for chapter in curriculum["chapters"]:
    chapter_rows.append([p(f"{chapter['order']:02d}", "KSmall"), p(chapter["title"], "KSmall"), p(" · ".join(chapter["dayIds"]), "KSmall")])
roadmap = Table(chapter_rows, colWidths=[18 * mm, 116 * mm, 40 * mm], repeatRows=1)
roadmap.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("GRID", (0, 0), (-1, -1), .4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.extend([roadmap, PageBreak()])

for day in curriculum["days"]:
    chapter = next(item for item in curriculum["chapters"] if item["id"] == day["chapterId"])
    practice = practices[day["guidedPracticeIds"][0]]
    story.extend([
        p(f"CHAPTER {chapter['order']:02d} · {chapter['title']}", "KH2"),
        Paragraph(f"{day['id']} · {escape(day['title'])}", styles["KDay"]),
        p(day["purpose"]),
        Spacer(1, 3 * mm),
    ])
    story.extend(heading("학습 목표 · 사전 진단"))
    story.extend(bullets(day["objectives"]))
    story.append(Paragraph("사전 진단", styles["KH3"]))
    story.extend(bullets(day["diagnostic"]))
    story.append(p("핵심 용어 · " + " · ".join(day["terms"]), "KSmall"))
    story.extend(heading("Learn · 정의에서 관찰까지"))
    learn_rows = []
    for label, key in [("정의", "definition"), ("왜 필요한가", "why"), ("내부 동작", "internals"), ("선택 기준", "choiceCriteria")]:
        learn_rows.append([p(label, "KH3"), p(day["learn"][key])])
    learn_table = Table(learn_rows, colWidths=[28 * mm, 146 * mm])
    learn_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), PALE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("PADDING", (0, 0), (-1, -1), 7)]))
    story.append(learn_table)
    for label, key in [("비교", "comparisons"), ("Trade-off", "tradeoffs"), ("실패 조건", "failureConditions"), ("관찰", "observe"), ("코드·명령 읽기", "howToRead")]:
        story.append(Paragraph(label, styles["KH3"]))
        story.extend(bullets(day["learn"][key]))
    story.append(PageBreak())

    example = day["workedExample"]
    story.extend([p(f"{day['id']} WORKED EXAMPLE", "KH2"), Paragraph("문제에서 검증까지", styles["KChapter"])])
    worked_rows = []
    worked_data = [
        ("문제", example["problem"]), ("관찰", " ".join(example["observations"])), ("가설", " ".join(example["hypotheses"])),
        ("조치", example["action"]), ("검증", example["validation"]), ("대안", " ".join(example["alternatives"])),
    ]
    for label, value in worked_data:
        worked_rows.append([p(label, "KH3"), p(value)])
    worked = Table(worked_rows, colWidths=[24 * mm, 150 * mm])
    worked.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), MINT), ("GRID", (0, 0), (-1, -1), .4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("PADDING", (0, 0), (-1, -1), 7)]))
    story.extend([worked, Spacer(1, 4 * mm)])
    story.extend(heading("Guided Practice · Independent Practice"))
    story.append(Paragraph("목표", styles["KH3"]))
    story.append(p(practice["goal"]))
    story.append(Paragraph("준비", styles["KH3"]))
    story.extend(bullets(practice["prerequisites"]))
    story.append(Paragraph("안내 단계", styles["KH3"]))
    story.extend(bullets(practice["guidedSteps"]))
    story.append(Paragraph("독립 단계", styles["KH3"]))
    story.extend(bullets(practice["independentSteps"]))
    story.append(Paragraph("명령", styles["KH3"]))
    for command in practice["commands"]:
        command_box = Table([[p(command, "KSmall")]], colWidths=[174 * mm])
        command_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("TEXTCOLOR", (0, 0), (-1, -1), colors.white), ("BOX", (0, 0), (-1, -1), .5, NAVY), ("PADDING", (0, 0), (-1, -1), 7)]))
        story.extend([command_box, Spacer(1, 1.5 * mm)])
    story.append(PageBreak())

    story.extend([p(f"{day['id']} VERIFY", "KH2"), Paragraph("실패를 만들고, 원인을 설명하고, 회귀를 막으세요", styles["KChapter"])])
    for label, key in [("실패 주입", "failureInjection"), ("관찰 증거", "observe"), ("검증", "verify"), ("회귀", "regression"), ("완료 기준", "completionCriteria")]:
        story.append(Paragraph(label, styles["KH3"]))
        story.extend(bullets(practice[key]))
    rubric_rows = [[p("항목", "KSmall"), p("배점", "KSmall")]] + [[p(key, "KSmall"), p(str(score), "KSmall")] for key, score in practice["rubric"].items()]
    rubric = Table(rubric_rows, colWidths=[130 * mm, 44 * mm])
    rubric.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PALE), ("GRID", (0, 0), (-1, -1), .4, LINE), ("PADDING", (0, 0), (-1, -1), 6)]))
    story.extend([Spacer(1, 3 * mm), rubric, Spacer(1, 4 * mm)])
    story.extend(heading("Quiz · Explain"))
    for index, question_id in enumerate(day["quizIds"], 1):
        question = questions[question_id]
        story.extend([
            Paragraph(f"{index}. {escape(question['prompt'])}", styles["KH3"]),
            p(f"유형 {question['type']} · 난이도 {question['difficulty']}", "KSmall"),
            p("기준 답안 · " + question["explanation"]),
        ])
    story.extend(heading("공식 자료"))
    for source_id in day["sourceRefs"]:
        source = sources[source_id]
        story.append(Paragraph(f"<link href=\"{escape(source['url'])}\" color=\"#1766D2\">{escape(source['title'])}</link> · {escape(source['authority'])}", styles["KSmall"]))
    story.append(PageBreak())

story.extend([Paragraph("완주 후 종합 점검", styles["KTitle"]), p("32일을 모두 끝낸 뒤에는 정의를 외우는 데서 멈추지 말고, 같은 상황을 재현하고 로그·메트릭·상태·실행계획으로 원인을 분리한 뒤 대안과 적용하지 않을 조건까지 설명하세요."), Spacer(1, 6 * mm), Paragraph("회상 체크", styles["KH2"])])
story.extend(bullets(["정의 없이 사례만 말하지 않았는가", "내부 상태 변화와 실패 경계를 설명했는가", "대안의 선택 조건과 비용을 비교했는가", "정상·경계·실패·재실행 증거를 남겼는가", "1·3·7·14일 간격으로 다시 설명했는가"]))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
StudyDoc(str(OUTPUT)).build(story)
print(f"Backend Study PDF built: {OUTPUT}")
