import puppeteer from "puppeteer";
export async function checkGrade(payload) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-setuid-sandbox",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();
  await page.goto("https://portal.aait.edu.et");
  await page.type('input[name="UserName"]', payload.username);
  await page.type('input[name="Password"]', payload.password);
  await page.click("button.btn");
  await page.waitForResponse("https://portal.aait.edu.et/Home");
  await page.goto("https://portal.aait.edu.et/Grade/GradeReport");
  const extractedData = await extractGradeTableData(page);
  await page.close();
  return extractedData;
}
async function extractGradeTableData(page) {
  const data = await page.evaluate(() => {
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
          console.log(yearPartMatch);
          currentYearSemester = {
            academicYear: yearMatch ? yearMatch[1].trim() : "N/A",
            year: yearPartMatch ? yearPartMatch[1].trim() : "N/A",
            semester: semesterMatch ? semesterMatch[1].trim() : "N/A",
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
  return data;
}
