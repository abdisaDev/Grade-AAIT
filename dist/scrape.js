import puppeteer from "puppeteer";

export async function checkGrade(payload) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--single-process",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.goto("https://portal.aait.edu.et", {
      waitUntil: "domcontentloaded",
    });

    await page.type('input[name="UserName"]', payload.username, { delay: 100 });
    await page.type('input[name="Password"]', payload.password, { delay: 100 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click("button.btn"),
    ]);

    await page.goto("https://portal.aait.edu.et/Grade/GradeReport", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table.table-bordered", { timeout: 10000 });

    const extractedData = await extractGradeTableData(page);
    await page.close();
    return extractedData;
  } catch (error) {
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

async function extractGradeTableData(page) {
  return await page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll(
      "table.table-bordered.table-striped.table-hover tbody tr"
    );

    let currentYearSemester = null;

    for (const row of rows) {
      if (row.classList.contains("yrsm")) {
        const pText = row.querySelector("p")?.textContent?.trim();
        if (pText) {
          const yearMatch = pText.match(/Academic Year\s*:\s*(\d{4}\/\d{2})/);
          const yearPartMatch = pText.match(/Year\s*([A-Za-z0-9]+),/);
          const semesterMatch = pText.match(/Semester\s*:\s*([^]+)/);

          currentYearSemester = {
            academicYear: yearMatch?.[1]?.trim() || "N/A",
            year: yearPartMatch?.[1]?.trim() || "N/A",
            semester: semesterMatch?.[1]?.trim() || "N/A",
          };
        }
      } else if (!row.classList.contains("success")) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 6) {
          const courseData = {
            no: cells[0]?.textContent?.trim() || "",
            courseTitle: cells[1]?.textContent?.trim() || "",
            code: cells[2]?.textContent?.trim() || "",
            creditHour: cells[3]?.textContent?.trim() || "",
            ects: cells[4]?.textContent?.trim() || "",
            grade: cells[5]?.textContent?.trim() || "",
            ...currentYearSemester,
          };
          results.push(courseData);
        }
      }
    }
    return results;
  });
}
