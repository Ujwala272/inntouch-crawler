# Quick Content Capture Guide - 5 Minutes Per Category

Since npm is blocked, use this manual method to capture full content with DevTools.

---

## Step-by-Step Instructions

### 1. Open InnTouch and Login

**URL**: https://www.inn-touch.ca/login.jspa

**Login** with your credentials

---

### 2. Navigate to First Category

**URL**: https://www.inn-touch.ca/community/local-sales-library/closing-the-sale

**Wait** for page to fully load (including KEY CONTENT section)

---

### 3. Open DevTools

Press **F12** (or Right-click → Inspect)

This opens the browser Developer Tools

---

### 4. Copy Full HTML

1. In the **Elements** tab (left panel)
2. Scroll to the very top
3. Find the `<html>` tag (first line)
4. **Right-click** on `<html>`
5. Select **Copy** → **Copy outerHTML**

![Screenshot showing HTML copy](devtools-copy-html.png)

---

### 5. Save to File

1. Open **Notepad** or **VS Code**
2. Paste (Ctrl+V)
3. Save as: `handling-objections-FULL.html`
4. Save to: `scraper\html-full\` folder

---

### 6. Extract Key Information

While you have the page open, also copy these separately:

#### A. Overview Text
Select and copy the full overview paragraph:
```
"Watch as Derrick Britt, Director, Sales Canada, gives a brief overview..."
[Copy all the text]
```

Save to: `handling-objections-overview.txt`

#### B. Video URL
1. Right-click on the video player
2. Select "Copy video URL" or inspect the iframe
3. Copy the Vimeo/YouTube URL

Example: `https://player.vimeo.com/video/123456789`

Save to: `handling-objections-video.txt`

#### C. KEY CONTENT Links
Copy the KEY CONTENT section:
```
KEY CONTENT
• Closing the Sale: Close with Commitment
• Closing the Sale: The Natural Outcome  
• Overcoming Objections with Clients
• Handling Objections with Clients: Video Notes
```

Save to: `handling-objections-key-content.txt`

---

### 7. Repeat for Priority Categories

Do steps 2-6 for these categories (in order of priority):

**Priority 1** (High - Has lots of content):
1. ✅ Handling Objections & Closing the Sale
2. ⏳ Building Rapport & Strategic Qualifying
3. ⏳ Preparation & Connecting
4. ⏳ Presenting Your Hotel

**Priority 2** (Medium):
5. Lead Generation
6. Market Segment Sales by Industry
7. Local Sales Training Shorts
8. Sales Tools & Resources

**Priority 3** (Low - Less dynamic content):
9. External Sales Content Hub
10. Sales Platforms (already has content)

---

## Quick Template for Each Category

Save 3 files per category:

```
scraper/captured-content/
├── handling-objections-FULL.html        ← Full HTML from DevTools
├── handling-objections-overview.txt     ← Overview paragraph text
├── handling-objections-video.txt        ← Video URL
└── handling-objections-key-content.txt  ← KEY CONTENT links list
```

---

## Alternative: Screenshot + Manual Input

If even this is too complex, you can:

1. Take screenshots of each section
2. Tell me what's missing
3. I'll help you format the content

---

## After You Capture Content

Once you have the files (even just 1-2 categories to start):

1. Share the text files or HTML with me
2. I'll extract the key information
3. Create updated Apex script with full content
4. Deploy to QA org
5. Verify it matches InnTouch

---

## Example: What I Need

For "Handling Objections & Closing the Sale":

**Overview Text**:
```
Watch as Derrick Britt, Director, Sales Canada, gives a brief overview 
of this section of the Local Sales Library, all about handing objections 
and closing the sale. Here, you'll find tips and tricks to address 
objections and overcome concerns, as well as what you need to do to 
secure the business for your hotel.
```

**Video URL**:
```
https://player.vimeo.com/video/946958663
```

**KEY CONTENT**:
```
• Closing the Sale: Close with Commitment → https://www.inn-touch.ca/docs/DOC-56075
• Closing the Sale: The Natural Outcome → https://www.inn-touch.ca/docs/DOC-56076
• Overcoming Objections with Clients → https://www.inn-touch.ca/docs/DOC-56077
• Handling Objections with Clients: Video Notes → https://www.inn-touch.ca/docs/DOC-56078
```

---

## Tips

**Can't find DevTools?**
- Try: Ctrl+Shift+I (alternative shortcut)
- Or: Menu → More Tools → Developer Tools

**Copy not working?**
- Try different browser (Chrome, Edge, Firefox)
- Or manually copy/paste text sections

**Page looks different?**
- Make sure you're logged in
- Scroll down to see KEY CONTENT section
- Wait 5 seconds for JavaScript to load

---

## Time Estimate

- First category: 5-10 min (learning the process)
- Subsequent categories: 3-5 min each
- All 10 categories: ~40 minutes

---

## Need Help?

**Stuck on any step?**
- Take a screenshot and share it
- I'll guide you through

**Want to do just 1-2 categories first?**
- Start with "Handling Objections" only
- I'll update that one and you can see the result
- Then do the rest if it looks good

---

## Ready?

Start with this category:

**URL**: https://www.inn-touch.ca/community/local-sales-library/closing-the-sale

1. Login to InnTouch
2. Navigate to URL above
3. Press F12
4. Copy HTML from DevTools
5. Save to file

Let me know when you have the first one captured!
