document.addEventListener("DOMContentLoaded", function () {

  // ======================
  // STATE
  // ======================
  let isSubmitting = false;
  let previousNumber = null;

  // ======================
  // JERSEY NUMBERS (00–99)
  // ======================
  const dropdown = document.getElementById("jerseyNumber");

  function buildNumbers() {
    dropdown.innerHTML = `<option value="">Select Number</option>`;

    const zero = document.createElement("option");
    zero.value = "00";
    zero.textContent = "00";
    dropdown.appendChild(zero);

    for (let i = 1; i <= 99; i++) {
      const val = i.toString().padStart(2, "0");

      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;

      dropdown.appendChild(opt);
    }
  }

  buildNumbers();

  // 
  // ADDITIONAL JERSEYS
  //
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

    const num = parseInt(count.value);

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

        <label>Jersey Size</label>
        <select class="extraSize">
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
          <option>Both </option>
        </select>
      `;

      container.appendChild(div);

      // fill numbers
      const select = div.querySelector(".extraNumber");

      const zero = document.createElement("option");
      zero.value = "00";
      zero.textContent = "00";
      select.appendChild(zero);

      for (let j = 1; j <= 99; j++) {
        const val = j.toString().padStart(2, "0");

        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;

        select.appendChild(opt);
      }
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

    if (!firstName || !lastName || !phone || !jerseyName || !jerseyNumber) {
      alert("Please fill all required fields");
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
      // COLLECT EXTRAS (FIXED)
      // ======================
      const extraJerseys = [];

      document.querySelectorAll(".extra-box").forEach(box => {

        const name = box.querySelector(".extraName").value.trim();
        const number = box.querySelector(".extraNumber").value;
        const size = box.querySelector(".extraSize").value;
        const sleeveType = box.querySelector(".extraSleeve").value;

        if (name) {
          extraJerseys.push({
            name,
            number,
            size,
            sleeve: sleeveType
          });
        }
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
        extras: extraJerseys,
        createdAt: Date.now()
      });

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
  // EDIT BUTTON FIX
  // ======================
  editBtn.addEventListener("click", function () {
    form.style.display = "block";
    thankYouBox.classList.add("hidden");

    previousNumber = document.getElementById("jerseyNumber").value;
  });

});