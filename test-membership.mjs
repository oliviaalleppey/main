import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/membership', { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for and click the "Apply Now" or similar enrollment trigger button
  // The trigger is a MembershipEnrollmentTrigger component
  await page.waitForTimeout(3000);

  // Find the enrollment trigger button
  const enrollButton = page.locator('button:has-text("Apply"), button:has-text("Enroll"), a:has-text("Apply"), a:has-text("Enroll"), [class*="enroll"]').first();
  
  // Try clicking various possible button texts
  const possibleTexts = ['Apply Now', 'Enroll Now', 'Apply', 'Enroll', 'Join Now', 'Get Started'];
  
  let clicked = false;
  for (const text of possibleTexts) {
    try {
      const btn = page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        clicked = true;
        console.log(`Clicked button with text: ${text}`);
        break;
      }
    } catch (e) {
      // continue
    }
  }

  if (!clicked) {
    // Try to find any clickable element that might open the form
    console.log('Looking for enrollment trigger...');
    const allButtons = await page.locator('button, a[role="button"]').all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      console.log('Found button:', text);
    }
  }

  await page.waitForTimeout(3000);

  // Take a screenshot to see current state
  await page.screenshot({ path: '/Users/agt/olivia/hotel-website/screenshot1.png', fullPage: true });
  console.log('Screenshot saved');

  // Now fill the form
  // Personal Details
  await page.fill('input[name="fullName"]', 'John Solomon');
  await page.fill('input[name="dateOfBirth"]', '1990-05-15');
  
  // Gender - select Male
  const genderSelect = page.locator('button:has-text("Select Gender")');
  if (await genderSelect.isVisible({ timeout: 2000 })) {
    await genderSelect.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]:has-text("Male")').first().click();
  }

  // Nationality - select Indian
  const nationalitySelect = page.locator('button:has-text("Select Country")');
  if (await nationalitySelect.isVisible({ timeout: 2000 })) {
    await nationalitySelect.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]:has-text("Indian")').first().click();
  }

  // Contact Information
  await page.fill('input[name="mobileNumber"]', '9876543210');
  await page.fill('input[name="emailAddress"]', 'me.johnsolomon@gmail.com');

  // Address Details
  await page.fill('input[name="residentialAddress"]', '123 MG Road, Marine Drive');
  await page.fill('input[name="city"]', 'Alappuzha');
  await page.fill('input[name="state"]', 'Kerala');
  await page.fill('input[name="country"]', 'India');
  await page.fill('input[name="pinCode"]', '688001');

  // Identification Details
  const idTypeSelect = page.locator('button:has-text("Select ID Type")');
  if (await idTypeSelect.isVisible({ timeout: 2000 })) {
    await idTypeSelect.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]:has-text("Aadhaar")').first().click();
  }
  await page.fill('input[name="idNumber"]', '1234 5678 9012');

  // Communication & Emergency
  const commSelect = page.locator('button:has-text("Select Preference")');
  if (await commSelect.isVisible({ timeout: 2000 })) {
    await commSelect.click();
    await page.waitForTimeout(500);
    await page.locator('div[role="option"]:has-text("Email")').first().click();
  }

  await page.fill('input[name="emergencyName"]', 'Jane Solomon');
  await page.fill('input[name="emergencyRelationship"]', 'Spouse');
  await page.fill('input[name="emergencyContactNumber"]', '9876543211');

  // Accept terms - use JavaScript to check the hidden checkbox
  await page.evaluate(() => {
    const checkbox = document.querySelector('input[name="termsAccepted"]');
    if (checkbox) {
      checkbox.click();
    }
  });

  // Take screenshot before submit
  await page.screenshot({ path: '/Users/agt/olivia/hotel-website/screenshot2.png', fullPage: true });
  console.log('Pre-submit screenshot saved');

  // Submit
  const submitBtn = page.locator('button:has-text("Submit Application")');
  await submitBtn.click();

  // Wait for success message
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/agt/olivia/hotel-website/screenshot3.png', fullPage: true });
  console.log('Post-submit screenshot saved');

  await browser.close();
})();
