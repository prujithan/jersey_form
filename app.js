document.addEventListener("DOMContentLoaded", function () {

  // ======================
  // STATE
  // ======================
  let isSubmitting = false;
  let previousNumber = null
  // ======================
  // HELPERS
  // ======================
  function fillJerseyNumbers(select) {
    for (let i = 0; i <= 99; i++) {
      const val = i.toString().padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    }
  }

  // ======================
  // MAIN JERSEY NUMBERS (00-99)
  // ======================
  const dropdown = document.getElementById("jerseyNumber");
  dropdown.innerHTML = `<option value="">Select Number</option>`;
  fillJerseyNumbers(dropdown);

  // ======================
  // ADDITIONAL JERSEYS
  // ======================
  // jerseyCount (top of form) only stores the number with the order.
  // extraToggle + extraCount (Additional Jerseys section) build the boxes.
  const jerseyCount = document.getElementById("jerseyCount");
  const toggle = document.getElementById("extraToggle");
  const section = document.getElementById("extraSection");
  const count = document.getElementById("extraCount");
  const container = document.getElementById("extraContainer");

  toggle.addEventListener("change", () => {
    if (toggle.value === "yes") {
      section.classList.remove("hidden");
      generateExtras();
    } else {
      section.classList.add("hidden");
      container.innerHTML = "";
    }
  });

  count.addEventListener("change", generateExtras);

  function generateExtras() {
    container.innerHTML = "";

    const num = parseInt(count.value) || 0;

    for (let i = 1; i <= num; i++) {
      const div = document.createElement("div");
      div.className = "extra-box";

      div.innerHTML = `
        <h3>Additional Jersey ${i}</h3>

        <input type="text" class="extraName" placeholder="Name on Jersey">

        <label>Jersey Number (Optional)</label>
        <select class="extraNumber">
          <option value="">No Number</option>
        </select>

        <label>Jersey Size (US Size)</label>
        <select class="extraSize">
          <option>Kid's size</option>
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
          <option>XXL</option>
        </select>

        <label>Sleeve Type</label>
        <select class="extraSleeve">
          <option>Half Sleeve</option>
          <option>Full Sleeve</option>
          <option>Both</option>
        </select>

        <label>Pant Size (US Size)</label>
        <select class="extraPant">
          <option value="">Select Size</option>
          <option>Kid's size</option>
          <option>XXS</option>
          <option>XS</option>
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
        </select>

        <label>Number of Caps</label>
        <select class="extraCaps">
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      `;

      container.appendChild(div);
      fillJerseyNumbers(div.querySelector(".extraNumber"));
    }
  }

  // ======================
  // LOAD TAKEN NUMBERS
  // ======================
  async function loadTakenNumbers() {
    const snapshot = await db.collection("jerseyNumbers").get();

    const taken = new Set();

    snapshot.forEach(doc => {
      taken.add(doc.id);
    });

    document.querySelectorAll("#jerseyNumber option").forEach(opt => {
      if (taken.has(opt.value)) {
        opt.disabled = true;
        opt.textContent = opt.value + " (Taken)";
      }
    });
  }

  loadTakenNumbers();

  // ======================
  // SUBMIT FORM
  // ======================
  const form = document.getElementById("jerseyForm");
  const thankYouBox = document.getElementById("thankYouBox");
  const editBtn = document.getElementById("editBtn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const jerseyName = document.getElementById("jerseyName").value.trim();
    const jerseyNumber = document.getElementById("jerseyNumber").value;
    const jerseySize = document.getElementById("jerseySize").value;
    const sleeve = document.getElementById("sleeve").value;
    const pantSize = document.getElementById("pantSize").value;
    const capCount = parseInt(document.getElementById("capCount").value) || 0;
    const additionalJerseyCount = parseInt(jerseyCount.value) || 0;

    if (!firstName || !lastName || !phone || !jerseyName || !jerseyNumber || !pantSize) {
      alert("Please fill all required fields");
      isSubmitting = false;
      return;
    }

    // ======================
    // COLLECT EXTRAS
    // ======================
    const extraJerseys = [];
    let extrasValid = true;

    document.querySelectorAll(".extra-box").forEach((box, index) => {
      const name = box.querySelector(".extraName").value.trim();
      const number = box.querySelector(".extraNumber").value;
      const size = box.querySelector(".extraSize").value;
      const sleeveType = box.querySelector(".extraSleeve").value;
      const pant = box.querySelector(".extraPant").value;
      const caps = parseInt(box.querySelector(".extraCaps").value) || 0;

      if (name) {
        if (!pant) {
          alert(`Please select a pant size for Additional Jersey ${index + 1}`);
          extrasValid = false;
          return;
        }

        extraJerseys.push({
          name,
          number,
          size,
          sleeve: sleeveType,
          pantSize: pant,
          caps
        });
      }
    });

    if (!extrasValid) {
      isSubmitting = false;
      return;
    }

    try {

      // ======================
      // RELEASE OLD NUMBER (EDIT FIX)
      // ======================
      if (previousNumber && previousNumber !== jerseyNumber) {
        await db.collection("jerseyNumbers")
          .doc(previousNumber)
          .delete();
      }

      // ======================
      // CHECK NEW NUMBER
      // ======================
      const ref = db.collection("jerseyNumbers").doc(jerseyNumber);
      const doc = await ref.get();

      if (doc.exists && jerseyNumber !== previousNumber) {
        alert("❌ Jersey number already taken!");
        isSubmitting = false;
        return;
      }

      // ======================
      // RESERVE NEW NUMBER
      // ======================
      await ref.set({
        name: jerseyName,
        firstName,
        lastName,
        timestamp: Date.now()
      });

      // ======================
      // SAVE FULL ORDER
      // ======================
      await db.collection("jerseys").add({
        firstName,
        lastName,
        phone,
        jerseyName,
        jerseyNumber,
        jerseySize,
        sleeve,
        pantSize,
        capCount,
        additionalJerseyCount,
        extras: extraJerseys,
        createdAt: Date.now()
      });

      document.getElementById("logoImg").src = "thank4.png";

      form.style.display = "none";
      thankYouBox.classList.remove("hidden");

      console.log("✅ Order saved successfully");

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    isSubmitting = false;
  });

  // ======================
  // EDIT BUTTON
  // ======================
  editBtn.addEventListener("click", function () {
    document.getElementById("logoImg").src = "logo2.png";

    form.style.display = "block";
    thankYouBox.classList.add("hidden");

    previousNumber = document.getElementById("jerseyNumber").value;
  });



// ======================
// IMAGE LIGHTBOX
// ======================
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

document.querySelectorAll(".img-box img").forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.remove("hidden");
  });
});

lightbox.addEventListener("click", () => {
  lightbox.classList.add("hidden");
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") lightbox.classList.add("hidden");
});

});
