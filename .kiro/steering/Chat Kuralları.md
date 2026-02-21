---
inclusion: always
---

# Communication & Localization Rules

## Language Requirements

- All user-facing content MUST be in Turkish
- UI labels, buttons, error messages, notifications, and tooltips in Turkish
- Database content (client names, campaign notes, etc.) can be in any language
- Code comments and documentation should be in English for maintainability
- Variable names, function names, and technical identifiers in English

## Turkish Formatting Standards

- Currency: Turkish Lira (TRY) with format: "₺1.234,56" (dot for thousands, comma for decimals)
- Dates: DD.MM.YYYY format (e.g., "20.02.2026")
- Time: 24-hour format (e.g., "14:30")
- Numbers: Use Turkish locale formatting (1.234,56)

## AI-Generated Content

When generating content via Gemini API:
- Prompts should request Turkish output explicitly
- Action plans, strategy cards, and recommendations in Turkish
- Creative content tailored to Turkish market and culture
- Use formal business Turkish ("siz" form, not "sen")

## Error Messages

- User-facing errors in Turkish with clear, actionable guidance
- Technical errors logged in English for debugging
- Validation messages in Turkish (e.g., "Bu alan zorunludur" not "This field is required")

## Terminology Consistency

Use consistent Turkish terms for key concepts:
- Client → Müşteri
- Campaign → Kampanya
- Budget → Bütçe
- Commission → Komisyon
- Lead → Potansiyel Müşteri
- Action Plan → Aksiyon Planı
- Strategy Card → Strateji Kartı
- Dashboard → Gösterge Paneli
- Report → Rapor

## Response Style

- Professional and concise
- Avoid overly technical jargon in user-facing content
- Provide context for recommendations
- Use bullet points for clarity in action plans