import os
import json
import datetime
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
from groq import Groq
from database import get_db_connection
# importuri pentru limitator requesturi api
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address) #get_remote_address ia ip-ul utilizatorului, o foloseste ca cheie de identificare
router = APIRouter()


# cum arata un mesaj in istoric
class MessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[MessageItem]


@router.post("/chat")
@limiter.limit("10/minute") #maxim 10 mesaje/minut de la acelasi ip
def ai_chat_assistant(request: Request, chat_payload: ChatRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # toate datele de care avem nevoie
    cursor.execute("""
        SELECT p.id, p.name, p.price, b.name, p.near_expiry_quantity, p.expiration_date,
               d.discount_value, d.discount_type
        FROM product p 
        JOIN brand b ON p.brand_id = b.id 
        LEFT JOIN discount d ON p.id = d.product_id AND d.discount_start_date <= NOW() AND d.discount_end_date >= NOW()
        WHERE p.stock_quantity > 0
    """)
    products = cursor.fetchall()

    cursor.execute("""
        SELECT p.id, p.name 
        FROM order_item oi
        JOIN product p ON oi.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 5
    """)
    top_db = cursor.fetchall()
    conn.close()

    top_sellers_text = ", ".join([f"{r[1]} (ID: {r[0]})" for r in top_db])
    if not top_sellers_text:
        top_sellers_text = "Nu avem destule date inca. Recomanda produse de baza populare."

    produse_linii = []
    today = datetime.date.today()

    # Logica ca in spring boot de calculare preturi dinamice
    for row in products:
        p_id, p_name, p_price, b_name, near_qty, exp_date, d_val, d_type = row

        # verificare reduceri din tabela de discounts
        fresh_price = p_price
        if d_val is not None:
            if d_type == 'PERCENT':
                fresh_price = p_price - (p_price * d_val / 100.0)
            elif d_type == 'FIXED':
                fresh_price = max(p_price - d_val, 0.0)

        # verificare reduceri clearance
        expiry_price = p_price
        has_clearance = False
        if near_qty and near_qty > 0 and exp_date:
            days = (exp_date - today).days
            if days <= 3:
                expiry_price = p_price * 0.25
            elif days <= 5:
                expiry_price = p_price * 0.55
            elif days <= 7:
                expiry_price = p_price * 0.75
            has_clearance = True

        # trimitem catre ai si pretul de baza, si pretul redus (daca are nevoie daca intreaba userul)
        if has_clearance and expiry_price < fresh_price:
            line = f"- [ID: {p_id}] {p_name} ({b_name}) : Pret Normal/Fresh: {p_price:.2f} LEI | Pret Clearance: {expiry_price:.2f} LEI [TAG: CLEARANCE]"
        elif d_val is not None:
            line = f"- [ID: {p_id}] {p_name} ({b_name}) : Pret Vechi: {p_price:.2f} LEI | Pret Promo: {fresh_price:.2f} LEI [TAG: FRESH PROMO]"
        else:
            line = f"- [ID: {p_id}] {p_name} ({b_name}) : Pret: {p_price:.2f} LEI"

        produse_linii.append(line)

    produse_text = "\n".join(produse_linii)

    # prompt pt ai de antrenare si setare context
    system_prompt = f"""You are Freshli, the ultimate friendly, warm, and natural-sounding culinary assistant for a premium grocery store. Your goal is to feel like a real human helping a friend shop.

            <INVENTORY_DATABASE>
            {produse_text}
            </INVENTORY_DATABASE>

            <TOP_SELLERS_DATABASE>
            {top_sellers_text}
            </TOP_SELLERS_DATABASE>

            <CORE_DIRECTIVES>
            1. STRICT MULTILINGUAL ADAPTATION (CRITICAL):
               - You MUST reply in the EXACT language of the user's VERY LAST MESSAGE.
               - If they write in English (e.g., "hello", "what's up"), you reply in 100% natural, fluent English.
               - If they write in Romanian, you reply in 100% natural, grammatically correct Romanian.
               - WARNING: The <INVENTORY_DATABASE> is in Romanian. DO NOT let this force you to speak Romanian! Mentally translate product names to English in your response if the user speaks English (e.g. "Piept de Pui" -> "Chicken Breast"). Keep the exact same IDs for the JSON.

            2. INVENTORY & RECOMMENDATIONS (ANTI-HALLUCINATION):
               - ONLY suggest products that exist in the <INVENTORY_DATABASE>. NEVER invent products or IDs.
               - DOUBLE-CHECK your response: every single ID in your 'produse_recomandate' array MUST be explicitly listed above.
               - TOP SELLERS: If asked what is popular or most ordered, use <TOP_SELLERS_DATABASE>.

            3. PRICING & DISCOUNTS LOGIC (CRITICAL):
               - The database shows "Pret Normal/Fresh", "Pret Clearance [TAG: CLEARANCE]", or "Pret Promo [TAG: FRESH PROMO]". 
               - IF THE USER ASKS WHAT IS ON SALE OR DISCOUNTED: You MUST explicitly look for items that have [TAG: CLEARANCE] or [TAG: FRESH PROMO]. DO NOT guess! DO NOT say an item is on sale if it lacks a discount tag! 
               - NEVER output raw database rows or raw IDs in the text. Weave names and prices naturally into your sentences. NEVER say (Product name (Product ID) ) 

            4. OUT OF BOUNDS / ANTI-JAILBREAK:
               - If asked about non-grocery topics, politely pivot back to shopping.
            </CORE_DIRECTIVES>

            <OUTPUT_FORMAT>
            You MUST output ONLY a raw, valid JSON object. No intro, no outro, no markdown blocks outside the JSON.
            {{
                "detected_language": "Write 'English', 'Romanian', etc. based on the user's very last message",
                "mesaj": "Your warm, natural response here. You MUST write this entirely in the 'detected_language'.",
                "produse_recomandate": [integer_id_1, integer_id_2]
            }}
            Note: The 'produse_recomandate' array must contain ONLY valid integer IDs from the <INVENTORY_DATABASE>.
            </OUTPUT_FORMAT>
            """

    # construire istoric
    groq_messages = [{"role": "system", "content": system_prompt}]

    # Doar ultimele 6 mesaje din istoric
    history = chat_payload.messages[-6:]
    for i, m in enumerate(history):
        if i == len(history) - 1 and m.role == "user":
            # mentine limba in functie de ultimul mesaj
            reminder = f"\n\n[CRITICAL SYSTEM REMINDER: The user just said '{m.content}'. Identify the language of this EXACT text (if it contains 'hello' or 'brother', it is English!). You MUST write your 'mesaj' entirely in that language. IF ASKED ABOUT DISCOUNTS, ONLY name products with [TAG: CLEARANCE] or [TAG: FRESH PROMO]. Return ONLY valid JSON.]"
            groq_messages.append({"role": m.role, "content": m.content + reminder})
        else:
            groq_messages.append({"role": m.role, "content": m.content})

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    chat_completion = client.chat.completions.create(
        messages=groq_messages,
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"}
    )

    return json.loads(chat_completion.choices[0].message.content)