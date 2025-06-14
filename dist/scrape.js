import puppeteer from "puppeteer";
export async function scrapeGrades(username, password) {
    if (!username || !password) {
        throw new Error("Username and password are required");
    }
    console.log("[Scraping] Initializing scraper...");
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true, // Keep this false for debugging, true for production
            executablePath: "/usr/bin/google-chrome",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000);
        console.log("[Scraping] Navigating to login page...");
        await page.goto("https://portal.aait.edu.et");
        console.log("[Scraping] Entering credentials...");
        await page.type('input[name="UserName"]', username);
        await page.type('input[name="Password"]', password);
        console.log("[Scraping] Submitting login form...");
        await page.click("button.btn");
        await page.waitForNavigation();
        console.log("[Scraping] Navigating to grade report...");
        await page.goto("https://portal.aait.edu.et/Grade/GradeReport");
        await page.waitForSelector("table.table-bordered.table-striped.table-hover");
        console.log("[Scraping] Parsing grade data...");
        const grades = await extractGradeTableData(page);
        await browser.close();
        console.log("[Scraping] Successfully scraped", grades.length, "records");
        return grades;
    }
    catch (error) {
        console.error("[Scraping Error]:", error);
        if (browser)
            await browser.close();
        throw new Error("Failed to scrape grades.");
    }
}
async function extractGradeTableData(page) {
    const rows = await page.$$("table.table-bordered.table-striped.table-hover tbody tr");
    const results = [];
    let currentYearSemester = null;
    for (const row of rows) {
        const isYrsm = await row.evaluate((el) => el.classList.contains("yrsm"));
        const isSuccess = await row.evaluate((el) => el.classList.contains("success"));
        if (isYrsm) {
            currentYearSemester = await row.evaluate((el) => {
                const pText = el.querySelector("p")?.textContent?.trim();
                if (!pText)
                    return null;
                const yearMatch = pText.match(/Academic Year\s*:\s*(\d{4}\/\d{2})/);
                const yearPartMatch = pText.match(/Year\s*([A-Za-z0-9]+),/);
                const semesterMatch = pText.match(/Semester\s*:\s*([^]+)/);
                return {
                    academicYear: yearMatch ? yearMatch[1].trim() : "N/A",
                    year: yearPartMatch ? yearPartMatch[1].trim() : "N/A",
                    semester: semesterMatch ? semesterMatch[1].trim() : "N/A",
                };
            });
        }
        else if (!isSuccess) {
            const courseData = await row.evaluate((el) => {
                const cells = el.querySelectorAll("td");
                if (cells.length < 6)
                    return null;
                return {
                    no: cells[0]?.textContent?.trim() || "",
                    courseTitle: cells[1]?.textContent?.trim() || "",
                    code: cells[2]?.textContent?.trim() || "",
                    creditHour: cells[3]?.textContent?.trim() || "",
                    ects: cells[4]?.textContent?.trim() || "",
                    grade: cells[5]?.textContent?.trim() || "",
                };
            });
            if (courseData) {
                let assessments = [];
                let assessmentButton = await row.$('button[data-toggle="modal"]');
                if (!assessmentButton) {
                    const buttons = await row.$$("button");
                    for (const button of buttons) {
                        const buttonText = await button.evaluate((el) => el.textContent);
                        if (buttonText && buttonText.includes("Assessment")) {
                            assessmentButton = button;
                            break;
                        }
                    }
                }
                if (assessmentButton) {
                    try {
                        await page.waitForSelector("#myModal", {
                            hidden: true,
                            timeout: 10000,
                        });
                        await assessmentButton.evaluate((btn) => btn.scrollIntoView({ behavior: "instant", block: "center" }));
                        await assessmentButton.evaluate((b) => b.click());
                        await page.waitForFunction(() => {
                            const modal = document.querySelector("#myModal");
                            return (modal &&
                                modal.classList.contains("show") &&
                                modal.clientHeight > 0);
                        }, { timeout: 10000 });
                        await new Promise((resolve) => setTimeout(resolve, 300));
                        assessments = await page.evaluate(() => {
                            const results = [];
                            const tableRows = document.querySelectorAll("#AssessmentEntryGrid table tbody tr");
                            tableRows.forEach((tr) => {
                                const tds = tr.querySelectorAll("td");
                                const th = tr.querySelector("th[colspan='3']");
                                if (tds.length === 3) {
                                    const name = tds[1]?.textContent?.trim() || "";
                                    const result = tds[2]?.textContent?.trim() || "";
                                    if (name) {
                                        results.push({ name, result });
                                    }
                                }
                                else if (th && th.textContent?.includes("Total Mark")) {
                                    const totalMatch = th.textContent.match(/:\s*([\d.]+)/);
                                    if (totalMatch && totalMatch[1]) {
                                        results.push({
                                            name: "Total",
                                            result: totalMatch[1].trim(),
                                        });
                                    }
                                }
                            });
                            return results;
                        });
                        const closeButton = await page.$("#myModal .modal-footer button[data-dismiss='modal']");
                        if (closeButton) {
                            await closeButton.evaluate((b) => b.click());
                        }
                        await page.waitForSelector("#myModal", {
                            hidden: true,
                            timeout: 10000,
                        });
                        await new Promise((resolve) => setTimeout(resolve, 300));
                    }
                    catch (e) {
                        console.error(`Could not process assessment for "${courseData.courseTitle}". Error: ${e.message}`);
                    }
                }
                results.push({
                    ...courseData,
                    ...currentYearSemester,
                    assessments,
                });
            }
        }
    }
    return results;
}