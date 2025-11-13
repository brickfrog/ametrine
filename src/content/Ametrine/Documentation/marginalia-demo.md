---
title: Marginalia Demo
tags: [demo, marginalia, features]
description: Demonstration of marginalia (side notes) feature with various examples
date: 2025-10-27
---

# Marginalia Demo

This page demonstrates the **marginalia** feature in Ametrine. Marginalia are side notes that appear in the margin on wide screens {{Like this example!}} and as footnotes on mobile devices.

## What are Marginalia?

Marginalia {{From Latin "margo" meaning margin}} refer to notes written in the margins of books and documents. They've been used for centuries by scholars {{Medieval monks were famous for their marginalia}} to add commentary, questions, or related thoughts without interrupting the main text flow.

## Usage

To create a marginalia note, simply wrap your text in double curly braces: `{{your note here}}`. The syntax is simple and unobtrusive {{Unlike footnotes which use brackets and numbers}}.

## Examples

### Short Notes

This is useful for brief asides {{Short and sweet!}} or quick clarifications {{Just a few words}} that enhance understanding without breaking the reading flow.

### Longer Commentary

Sometimes you need more space to explain a concept {{This is an example of a longer marginalia note. It provides additional context and explanation that would be too disruptive if placed in the main text. On desktop, this will appear in the margin. On mobile, it becomes a numbered footnote at the bottom of the page.}}.

### Multiple Notes in One Paragraph

You can have multiple marginalia notes {{First note}} in a single paragraph {{Second note}} without any issues {{Third note}}. Each gets its own number and position.

## Combining with Other Features

Marginalia work alongside other Ametrine features:

- ==Highlights== with marginalia {{You can combine these!}}
- **Bold** and _italic_ text {{Formatting works normally}}
- [[wikilinks-and-graph|wikilinks]] {{These link to other pages}}
- Code snippets {{Even in technical writing}}

### With Lists

1. First item {{Notes work in lists too}}
2. Second item {{Each can have its own marginalia}}
3. Third item {{Very flexible!}}

### With Callouts

> [!tip] Using Marginalia Effectively
> Use marginalia for:
>
> - Tangential thoughts {{Related but not essential}}
> - Quick definitions {{Technical terms}}
> - Citations or sources {{References}}
> - Personal commentary {{Your own thoughts}}

## Technical Details

The marginalia feature uses:

- Remark plugin for parsing {{Processes markdown AST}}
- Tufte CSS-inspired styling {{Named after Edward Tufte}}
- Responsive design {{Desktop: margins, Mobile: footnotes}}
- Automatic numbering {{Sequential IDs}}

## Reader Mode

Try clicking the reader mode toggle {{Look for the book icon in the header}} to see how marginalia work in distraction-free reading mode. The sidebars hide {{More focus on content}} but marginalia remain visible.

## Best Practices

**Keep them concise** {{Under 2-3 sentences usually}}. Marginalia should enhance, not overwhelm {{If it's too long, it belongs in the main text}}. They're perfect for:

- Definitions {{New or technical terms}}
- Etymology {{Word origins}}
- Cross-references {{See also...}}
- Quick facts {{Dates, numbers, stats}}
- Personal notes {{Your thoughts}}

## Academic Use

Marginalia are particularly useful for academic writing {{Similar to glosses in classical texts}}. They allow you to provide scholarly context {{Historical background, for example}} without cluttering your prose with footnotes {{Though both have their place}}.

### Example: Philosophy

Descartes' famous statement "Cogito, ergo sum" {{Latin: "I think, therefore I am"}} became the foundation of modern philosophy {{Known as Cartesian philosophy}}. His method of systematic doubt {{Also called methodological skepticism}} influenced generations of thinkers.

## Comparison with Footnotes

| Feature      | Marginalia         | Footnotes        |
| ------------ | ------------------ | ---------------- |
| Placement    | Margin/inline      | Bottom of page   |
| Numbering    | Automatic          | Manual/automatic |
| Use case     | Quick asides       | Full citations   |
| Reading flow | Minimal disruption | Requires jumping |

Marginalia {{double braces}} are better for quick notes, while traditional footnotes[^1] work well for formal citations.

[^1]: This is a traditional markdown footnote for comparison.

## Markdown Support

Marginalia now support **full markdown formatting** {{This includes _italic_, **bold**, `code`, and [links](https://en.wikipedia.org/wiki/Markdown)}}. This makes them even more powerful for adding rich context.

### Text Formatting

You can use emphasis {{_This is italic text_}}, strong emphasis {{**This is bold text**}}, and even combine them {{_**Bold and italic together**_}}.

### Links and References

Add external links {{See [MDN Web Docs](https://developer.mozilla.org) for more info}} or reference other resources {{Check out [Wikipedia](https://en.wikipedia.org) for general knowledge}}.

### Code Snippets

Include inline code {{Use `const x = 42` for constants}} or technical terms {{The `Array.prototype.map()` method is useful}}.

### Images

You can even include images in marginalia {{![Placeholder](https://picsum.photos/200/150)}}. They'll be constrained to the margin column width automatically.

## Conclusion

Marginalia provide a elegant way to add commentary {{Without breaking flow}} to your digital garden. They're especially effective on wide screens {{Where space is plentiful}} and gracefully degrade on mobile {{Becoming numbered notes}}.

Try creating your own marginalia notes and see how they enhance your writing!
