# Siddhant Nabera | My résumé site

I put my projects, experience and education on one page. The Work section lets you filter the projects by topic and open each one for more detail.

## Open the site

Open `index.html` in your browser. If you make a change in VS Code, save it and refresh the page.

If you downloaded the code update, copy the extracted files into your existing website folder and choose **Replace the files in the destination**. You should be able to see `index.html` and the `assets` folder side by side.

## Where things are

| File | What’s in it |
| --- | --- |
| `index.html` | My résumé sections, headings and links |
| `assets/styles.css` | The colours, layout and animations |
| `assets/bootstrap-utilities.css` | A few Bootstrap classes that help the filter buttons wrap on smaller screens |
| `assets/site.js` | The menu, project filters, pop-ups and pause button |
| `data/projects.json` | The text and image names for my projects |
| `tools/build-projects.php` | Takes the project data and writes the cards into the HTML |

If I change a project in `data/projects.json`, I run this from the website folder with PHP 8.1 or later.

```bash
php tools/build-projects.php
```

GitHub Pages uses `index.html` with the cards already in it, so I can upload the site straight away.

## Upload to GitHub

1. Open the same repo. Check **Settings → Pages** for the branch and folder it uses.
2. In **Code**, open that branch and folder. Click **Add file → Upload files**.
3. Drag in everything inside the website folder. Keep `assets`, `data`, `tools` and `.nojekyll` next to `index.html`. Then commit the files.
4. Once Pages finishes updating, click **Visit site** and try the menu, filters, and résumé download.

## Submit the assignment

Open `RollNo_WD_MTProject.pdf` in desktop Chrome and fill in your roll number, live website URL and GitHub repo URL. Download it with your changes and save it as `YOURROLLNO_WD_MTProject.pdf` with your actual roll number. Open the saved copy to check both URLs, then submit the PDF through the college portal on your computer.

I liked the big title and moving cover on the [Luna Rossa AC40 page](https://auge-xp.com/works/ac40-lunarossa). The artwork on this site is illustrative.
