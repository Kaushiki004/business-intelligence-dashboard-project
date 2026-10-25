// Sample records are shown when the dashboard first opens.
const sampleTransactions = [
  { orderId: "1001", date: "2026-10-01", product: "Laptop", quantity: 1, price: 50000 },
  { orderId: "1002", date: "2026-10-02", product: "Mouse", quantity: 2, price: 500 },
  { orderId: "1003", date: "2026-10-03", product: "Keyboard", quantity: 1, price: 1500 },
  { orderId: "1004", date: "2026-10-04", product: "Notebook", quantity: 5, price: 80 },
  { orderId: "1005", date: "2026-10-05", product: "Headphones", quantity: 2, price: 2200 },
  { orderId: "1006", date: "2026-10-06", product: "Laptop", quantity: 1, price: 52000 },
  { orderId: "1007", date: "2026-10-07", product: "Mouse", quantity: 3, price: 450 },
  { orderId: "1008", date: "2026-10-08", product: "Notebook", quantity: 10, price: 75 },
  { orderId: "1009", date: "2026-10-09", product: "Keyboard", quantity: 2, price: 1400 },
  { orderId: "1010", date: "2026-10-10", product: "Headphones", quantity: 1, price: 2500 },
  { orderId: "1011", date: "2026-10-11", product: "Laptop", quantity: 1, price: 48000 },
  { orderId: "1012", date: "2026-10-12", product: "Mouse", quantity: 4, price: 500 }
];

let transactions = [...sampleTransactions];
let revenueChart = null;

const searchInput = document.getElementById("searchInput");
const transactionBody = document.getElementById("transactionBody");
const statusMessage = document.getElementById("statusMessage");

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(amount);
}

function getRevenue(row) {
  return row.quantity * row.price;
}

function renderDashboard() {
  // Summary cards use the full dataset, not just the search results.
  const totalRevenue = transactions.reduce((sum, row) => sum + getRevenue(row), 0);
  document.getElementById("totalRevenue").textContent = money(totalRevenue);
  document.getElementById("totalOrders").textContent = transactions.length;

  const productTotals = {};
  transactions.forEach(row => {
    productTotals[row.product] = (productTotals[row.product] || 0) + getRevenue(row);
  });
  const sortedProducts = Object.entries(productTotals).sort((a, b) => b[1] - a[1]);
  document.getElementById("topProduct").textContent = sortedProducts.length ? sortedProducts[0][0] : "—";

  const labels = sortedProducts.map(item => item[0]);
  const values = sortedProducts.map(item => item[1]);
  if (revenueChart) revenueChart.destroy();
  const canvas = document.getElementById("revenueChart");
  if (typeof Chart !== "undefined") {
    revenueChart = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets: [{ label: "Revenue", data: values, borderWidth: 1, borderRadius: 6 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: value => "₹" + Number(value).toLocaleString("en-IN") } } }
      }
    });
  }

  renderTable();
}

function renderTable() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredRows = transactions.filter(row =>
    [row.orderId, row.date, row.product, row.quantity, row.price]
      .some(value => String(value).toLowerCase().includes(searchTerm))
  );

  transactionBody.innerHTML = "";
  filteredRows.forEach(row => {
    const tr = document.createElement("tr");
    [row.orderId, row.date, row.product, row.quantity, money(row.price), money(getRevenue(row))]
      .forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
    transactionBody.appendChild(tr);
  });

  document.getElementById("resultCount").textContent =
    `Showing ${filteredRows.length} of ${transactions.length} transactions`;
  if (filteredRows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No matching transactions. Try another search.";
    tr.appendChild(td);
    transactionBody.appendChild(tr);
  }
}

// The search box updates the table every time the user types.
searchInput.addEventListener("input", renderTable);

document.getElementById("resetSearch").addEventListener("click", () => {
  searchInput.value = "";
  renderTable();
});

// Simple CSV reader for this project's format.
// Expected headings: OrderID,Date,Product,Quantity,Price
document.getElementById("csvFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.trim().split(/\r?\n/);
      const headings = lines[0].split(",").map(h => h.trim().toLowerCase());
      const required = ["orderid", "date", "product", "quantity", "price"];
      const indexes = required.map(name => headings.indexOf(name));

      if (indexes.some(index => index === -1)) {
        throw new Error("CSV headings must be OrderID, Date, Product, Quantity, Price.");
      }

      const imported = lines.slice(1).filter(line => line.trim()).map(line => {
        const cells = line.split(",").map(cell => cell.trim());
        return {
          orderId: cells[indexes[0]],
          date: cells[indexes[1]],
          product: cells[indexes[2]],
          quantity: Number(cells[indexes[3]]),
          price: Number(cells[indexes[4]])
        };
      });

      if (!imported.length || imported.some(row =>
        !row.orderId || !row.product || !Number.isFinite(row.quantity) ||
        !Number.isFinite(row.price) || row.quantity < 0 || row.price < 0
      )) {
        throw new Error("No valid rows found. Check the CSV data and try again.");
      }

      transactions = imported;
      searchInput.value = "";
      renderDashboard();
      statusMessage.textContent = `Loaded ${transactions.length} transactions from ${file.name}.`;
    } catch (error) {
      statusMessage.textContent = "Could not load CSV: " + error.message;
    }
  };
  reader.readAsText(file);
});

renderDashboard();
