(async () => {
  const check = (condition, message) => {
    if (!condition) throw Error(message);
  };
  const $ = (s) => document.querySelector(s),
    form = $("#contact-form");
  for (let i = 0; i < 40 && $("#contact-next").hidden; i++)
    await new Promise((r) => setTimeout(r, 50));
  check(!$("#scanner-context").hidden, "Scanner context missing");
  $("#contact-next").click();
  check(
    $("#form-error").textContent.length > 0,
    "Missing interest not validated",
  );
  form.querySelector("[name=interest]").click();
  $("#contact-next").click();
  check($("#contact-progress").textContent === "02 / 05", "Step 2 missing");
  form.elements.name.value = "Preview Test";
  form.elements.company.value = "Example";
  form.elements.website.value = "invalid";
  $("#contact-next").click();
  check($("#form-error").textContent.length > 0, "Website not validated");
  form.elements.website.value = "https://example.com";
  $("#contact-next").click();
  check($("#contact-progress").textContent === "03 / 05", "Step 3 missing");
  form.elements.workflow.value =
    "Research every new lead manually, then copy notes into a CRM.";
  $("#contact-next").click();
  form.elements.stage.value = "Planning";
  $("#contact-next").click();
  form.elements.email.value = "not-an-email";
  $("#contact-submit").click();
  check($("#form-error").textContent.length > 0, "Email not validated");
  form.elements.email.value = "preview@example.com";
  form.elements.consent.checked = true;
  $("#contact-submit").click();
  await new Promise((r) => setTimeout(r, 50));
  check(!$("#contact-result").hidden, "Brief not prepared");
  check(
    $("#brief-preview").textContent.includes("Initial assessment:"),
    "Context absent from brief",
  );
  check($("#send-email").href.startsWith("mailto:"), "Mailto missing");
  check(
    $("#contact-result").textContent.includes("Nothing has been sent"),
    "False delivery claim",
  );
  check(document.documentElement.scrollWidth <= innerWidth, "Contact overflow");
  $("#edit-brief").click();
  check(!form.hidden, "Edit brief failed");
  return {
    passed: true,
    checks: [
      "scanner context",
      "required validation",
      "website validation",
      "five steps",
      "email validation",
      "consent",
      "brief",
      "edit",
      "overflow",
    ],
  };
})();
