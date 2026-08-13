/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let cart = [];

const SALES_STORAGE_KEY = "pos_sales";


/*
|--------------------------------------------------------------------------
| BOOTSTRAP MODALS
|--------------------------------------------------------------------------
*/

const paymentModal = new bootstrap.Modal(
    document.getElementById("paymentModal")
);

const saleCompletedModal = new bootstrap.Modal(
    document.getElementById("saleCompletedModal")
);


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const productSearch = document.getElementById("productSearch");
const searchResults = document.getElementById("searchResults");

const cartContainer = document.getElementById("cartContainer");

const cartItemCount = document.getElementById("cartItemCount");

const summaryItems = document.getElementById("summaryItems");
const summaryQuantity = document.getElementById("summaryQuantity");
const summaryTotal = document.getElementById("summaryTotal");

const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const paymentTotal = document.getElementById("paymentTotal");
const saleComment = document.getElementById("saleComment");

const salesHistoryContainer =
    document.getElementById("salesHistoryContainer");


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function money(value) {
    return Number(value).toFixed(2);
}


function getProductByBarcode(barcode) {

    barcode = String(barcode).trim();

    return PRODUCTS.find(
        product => String(product.barcode) === barcode
    );
}


function getCartQuantity() {

    return cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
}


function getCartTotal() {

    return cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );
}


/*
|--------------------------------------------------------------------------
| ADD PRODUCT
|--------------------------------------------------------------------------
*/

function addProduct(product) {

    if (!product) {
        return;
    }

    const existing = cart.find(
        item => String(item.barcode) === String(product.barcode)
    );

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            barcode: product.barcode,
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });

    }

    renderCart();

}


/*
|--------------------------------------------------------------------------
| CHANGE QUANTITY
|--------------------------------------------------------------------------
*/

function changeQuantity(barcode, amount) {

    const item = cart.find(
        product =>
            String(product.barcode) === String(barcode)
    );

    if (!item) {
        return;
    }

    item.quantity += amount;

    if (item.quantity <= 0) {

        cart = cart.filter(
            product =>
                String(product.barcode) !== String(barcode)
        );

    }

    renderCart();
}


/*
|--------------------------------------------------------------------------
| REMOVE PRODUCT
|--------------------------------------------------------------------------
*/

function removeProduct(barcode) {

    cart = cart.filter(
        product =>
            String(product.barcode) !== String(barcode)
    );

    renderCart();
}


/*
|--------------------------------------------------------------------------
| RENDER CART
|--------------------------------------------------------------------------
*/

function renderCart() {

    cartContainer.innerHTML = "";

    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <div class="display-5 mb-3">🛒</div>

                    <h5>No products added</h5>

                    <p>
                        Search for a product or scan its barcode.
                    </p>
                </div>
            </div>
        `;

    } else {

        cart.forEach(item => {

            const itemTotal =
                item.price * item.quantity;

            const col = document.createElement("div");

            col.className = "col-md-6 col-xl-4";

            col.innerHTML = `
                <div class="card product-card h-100">

                    <div class="card-body d-flex flex-column">

                        <div class="d-flex justify-content-between gap-2">

                            <h6 class="product-name mb-0">
                                ${escapeHtml(item.name)}
                            </h6>

                            <button
                                class="btn btn-sm btn-outline-danger remove-product"
                                data-barcode="${item.barcode}"
                                title="Remove"
                            >
                                ×
                            </button>

                        </div>

                        <div class="mt-2">

                            <span class="badge bg-light text-dark barcode-badge">
                                ${escapeHtml(item.barcode)}
                            </span>

                        </div>

                        <div class="mt-3">

                            <div class="text-muted small">
                                Price
                            </div>

                            <strong>
                                ${money(item.price)}
                            </strong>

                        </div>

                        <div class="mt-auto pt-3">

                            <div class="quantity-control">

                                <button
                                    class="btn btn-outline-secondary quantity-minus"
                                    data-barcode="${item.barcode}"
                                >
                                    −
                                </button>

                                <span class="quantity-value">
                                    ${item.quantity}
                                </span>

                                <button
                                    class="btn btn-outline-secondary quantity-plus"
                                    data-barcode="${item.barcode}"
                                >
                                    +
                                </button>

                            </div>

                            <div
                                class="text-center mt-3 fw-bold fs-5"
                            >
                                ${money(itemTotal)}
                            </div>

                        </div>

                    </div>

                </div>
            `;

            cartContainer.appendChild(col);

        });

    }


    updateSummary();

}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function updateSummary() {

    const itemCount = cart.length;
    const quantity = getCartQuantity();
    const total = getCartTotal();

    summaryItems.textContent = itemCount;
    summaryQuantity.textContent = quantity;
    summaryTotal.textContent = money(total);

    cartItemCount.textContent =
        `${quantity} item${quantity === 1 ? "" : "s"}`;

    checkoutBtn.disabled = cart.length === 0;
    clearCartBtn.disabled = cart.length === 0;

}


/*
|--------------------------------------------------------------------------
| CART BUTTON EVENTS
|--------------------------------------------------------------------------
*/

cartContainer.addEventListener("click", event => {

    const plusButton =
        event.target.closest(".quantity-plus");

    const minusButton =
        event.target.closest(".quantity-minus");

    const removeButton =
        event.target.closest(".remove-product");


    if (plusButton) {

        changeQuantity(
            plusButton.dataset.barcode,
            1
        );

    }


    if (minusButton) {

        changeQuantity(
            minusButton.dataset.barcode,
            -1
        );

    }


    if (removeButton) {

        removeProduct(
            removeButton.dataset.barcode
        );

    }

});


/*
|--------------------------------------------------------------------------
| PRODUCT SEARCH
|--------------------------------------------------------------------------
*/

productSearch.addEventListener("input", () => {

    const query =
        productSearch.value.trim().toLowerCase();

    if (!query) {

        hideSearchResults();
        return;

    }


    /*
     * First check whether this is an exact barcode.
     */

    const exactBarcode = PRODUCTS.find(
        product =>
            String(product.barcode) === query
    );


    if (exactBarcode) {

        addProduct(exactBarcode);

        productSearch.value = "";

        hideSearchResults();

        return;

    }


    /*
     * Otherwise search by name OR partial barcode.
     */

    const matches = PRODUCTS
        .filter(product => {

            const name =
                String(product.name).toLowerCase();

            const barcode =
                String(product.barcode);

            return (
                name.includes(query) ||
                barcode.includes(query)
            );

        })
        .slice(0, 10);


    renderSearchResults(matches);

});


/*
|--------------------------------------------------------------------------
| SEARCH RESULTS
|--------------------------------------------------------------------------
*/

function renderSearchResults(products) {

    searchResults.innerHTML = "";

    if (products.length === 0) {

        searchResults.innerHTML = `
            <div class="list-group-item text-muted">
                No products found
            </div>
        `;

        searchResults.classList.remove("d-none");

        return;
    }


    products.forEach(product => {

        const item =
            document.createElement("button");

        item.type = "button";

        item.className =
            "list-group-item list-group-item-action search-result-item";

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">

                <div>

                    <div class="fw-semibold">
                        ${escapeHtml(product.name)}
                    </div>

                    <small class="text-muted">
                        ${escapeHtml(product.barcode)}
                    </small>

                </div>

                <strong>
                    ${money(product.price)}
                </strong>

            </div>
        `;


        item.addEventListener("click", () => {

            addProduct(product);

            productSearch.value = "";

            hideSearchResults();

            productSearch.focus();

        });


        searchResults.appendChild(item);

    });


    searchResults.classList.remove("d-none");

}


function hideSearchResults() {

    searchResults.classList.add("d-none");

    searchResults.innerHTML = "";

}


/*
|--------------------------------------------------------------------------
| ENTER KEY
|--------------------------------------------------------------------------
|
| This is particularly useful with barcode scanners.
|
| Most barcode scanners type the barcode and then press ENTER.
|
*/

productSearch.addEventListener("keydown", event => {

    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();

    const barcode =
        productSearch.value.trim();

    if (!barcode) {
        return;
    }


    const product =
        getProductByBarcode(barcode);


    if (product) {

        addProduct(product);

        productSearch.value = "";

        hideSearchResults();

    } else {

        /*
         * If it isn't a barcode, select the first
         * autocomplete result.
         */

        const firstResult =
            searchResults.querySelector(
                ".search-result-item"
            );

        if (firstResult) {

            firstResult.click();

        } else {

            alert("Product not found.");

        }

    }

});


/*
|--------------------------------------------------------------------------
| CLEAR SEARCH
|--------------------------------------------------------------------------
*/

document
    .getElementById("clearSearchBtn")
    .addEventListener("click", () => {

        productSearch.value = "";

        hideSearchResults();

        productSearch.focus();

    });


/*
|--------------------------------------------------------------------------
| CLICK OUTSIDE SEARCH
|--------------------------------------------------------------------------
*/

document.addEventListener("click", event => {

    if (
        !event.target.closest(".search-wrapper")
    ) {

        hideSearchResults();

    }

});


/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
*/

clearCartBtn.addEventListener("click", () => {

    if (cart.length === 0) {
        return;
    }

    if (
        !confirm("Clear the current sale?")
    ) {
        return;
    }

    cart = [];

    renderCart();

});


/*
|--------------------------------------------------------------------------
| CHECKOUT
|--------------------------------------------------------------------------
*/

checkoutBtn.addEventListener("click", () => {

    if (cart.length === 0) {
        return;
    }

    paymentTotal.textContent =
        money(getCartTotal());

    saleComment.value = "";

    document.getElementById("paymentCash").checked = true;

    paymentModal.show();

});


/*
|--------------------------------------------------------------------------
| CONFIRM SALE
|--------------------------------------------------------------------------
*/

document
    .getElementById("confirmSaleBtn")
    .addEventListener("click", () => {

        if (cart.length === 0) {
            return;
        }


        const paymentMethod =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            ).value;


        const sale = {

            id: generateSaleId(),

            createdAt:
                new Date().toISOString(),

            paymentMethod,

            comment:
                saleComment.value.trim(),

            products:
                cart.map(item => ({
                    barcode: item.barcode,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total:
                        item.price * item.quantity
                })),

            total:
                getCartTotal(),

            quantity:
                getCartQuantity()

        };


        saveSale(sale);


        /*
         * Clear current sale.
         */

        cart = [];

        renderCart();


        paymentModal.hide();


        /*
         * Show confirmation.
         */

        document.getElementById(
            "completedSaleId"
        ).textContent = sale.id;

        setTimeout(() => {
            saleCompletedModal.show();
        }, 300);

    });


/*
|--------------------------------------------------------------------------
| SAVE SALE
|--------------------------------------------------------------------------
*/

function saveSale(sale) {

    const sales = getSales();

    sales.unshift(sale);

    localStorage.setItem(
        SALES_STORAGE_KEY,
        JSON.stringify(sales)
    );

}


/*
|--------------------------------------------------------------------------
| GET SALES
|--------------------------------------------------------------------------
*/

function getSales() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SALES_STORAGE_KEY
            )
        ) || [];

    } catch (error) {

        console.error(
            "Could not read sales:",
            error
        );

        return [];

    }

}


/*
|--------------------------------------------------------------------------
| SALE ID
|--------------------------------------------------------------------------
*/

function generateSaleId() {

    const date =
        new Date();

    const timestamp =
        date.getTime();

    return `SALE-${timestamp}`;

}


/*
|--------------------------------------------------------------------------
| SALES HISTORY
|--------------------------------------------------------------------------
*/

function renderSalesHistory() {

    const sales = getSales();

    salesHistoryContainer.innerHTML = "";


    if (sales.length === 0) {

        salesHistoryContainer.innerHTML = `
            <div class="empty-state">
                <div class="display-5 mb-3">📋</div>

                <h5>No sales yet</h5>

                <p>
                    Completed sales will appear here.
                </p>
            </div>
        `;

        return;

    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "accordion";


    sales.forEach((sale, index) => {

        const date =
            new Date(sale.createdAt);

        const formattedDate =
            date.toLocaleString();


        const accordionItem =
            document.createElement("div");

        accordionItem.className =
            "accordion-item";


        const productsHtml =
            sale.products.map(product => `
                <div class="history-product">

                    <div class="d-flex justify-content-between">

                        <div>

                            <strong>
                                ${escapeHtml(product.name)}
                            </strong>

                            <div class="text-muted small">

                                ${product.quantity}
                                ×
                                ${money(product.price)}

                            </div>

                        </div>

                        <strong>
                            ${money(product.total)}
                        </strong>

                    </div>

                </div>
            `).join("");


        accordionItem.innerHTML = `

            <h2
                class="accordion-header"
                id="heading-${index}"
            >

                <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#sale-${index}"
                >

                    <div class="container-fluid px-0">

                        <div class="row align-items-center">

                            <div class="col-md-3">

                                <strong>
                                    ${escapeHtml(sale.id)}
                                </strong>

                            </div>

                            <div class="col-md-3 text-muted">

                                ${formattedDate}

                            </div>

                            <div class="col-md-2">

                                <span class="badge ${paymentBadgeClass(sale.paymentMethod)}">

                                    ${sale.paymentMethod}

                                </span>

                            </div>

                            <div class="col-md-2">

                                ${sale.quantity} items

                            </div>

                            <div class="col-md-2 fw-bold">

                                ${money(sale.total)}

                            </div>

                        </div>

                    </div>

                </button>

            </h2>


            <div
                id="sale-${index}"
                class="accordion-collapse collapse"
                data-bs-parent="#salesHistoryContainer"
            >

                <div class="accordion-body">

                    <div class="row">

                        <div class="col-lg-8">

                            <h6 class="mb-3">
                                Products
                            </h6>

                            <div class="history-products">

                                ${productsHtml}

                            </div>

                        </div>


                        <div class="col-lg-4">

                            <div class="card bg-light">

                                <div class="card-body">

                                    <h6>
                                        Sale Details
                                    </h6>

                                    <hr>

                                    <div class="d-flex justify-content-between">
                                        <span>Payment</span>
                                        <strong>
                                            ${sale.paymentMethod}
                                        </strong>
                                    </div>

                                    <div class="d-flex justify-content-between mt-2">
                                        <span>Quantity</span>
                                        <strong>
                                            ${sale.quantity}
                                        </strong>
                                    </div>

                                    <div class="d-flex justify-content-between mt-2">
                                        <span>Total</span>
                                        <strong>
                                            ${money(sale.total)}
                                        </strong>
                                    </div>

                                    ${
                                        sale.comment
                                            ? `
                                                <hr>

                                                <div>
                                                    <small class="text-muted">
                                                        Commentary
                                                    </small>

                                                    <div class="mt-1">
                                                        ${escapeHtml(sale.comment)}
                                                    </div>
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;


        wrapper.appendChild(accordionItem);

    });


    salesHistoryContainer.appendChild(wrapper);

}


/*
|--------------------------------------------------------------------------
| PAYMENT BADGE
|--------------------------------------------------------------------------
*/

function paymentBadgeClass(method) {

    switch (method) {

        case "CASH":
            return "bg-success";

        case "CARD":
            return "bg-primary";

        case "LOAN":
            return "bg-warning text-dark";

        default:
            return "bg-secondary";

    }

}


/*
|--------------------------------------------------------------------------
| NAVIGATION
|--------------------------------------------------------------------------
*/

const posPage =
    document.getElementById("posPage");

const salesPage =
    document.getElementById("salesPage");


document
    .getElementById("showPosBtn")
    .addEventListener("click", () => {

        posPage.classList.remove("d-none");
        salesPage.classList.add("d-none");

        productSearch.focus();

    });


document
    .getElementById("showSalesBtn")
    .addEventListener("click", () => {

        posPage.classList.add("d-none");
        salesPage.classList.remove("d-none");

        renderSalesHistory();

    });


/*
|--------------------------------------------------------------------------
| CLEAR SALES HISTORY
|--------------------------------------------------------------------------
*/

document
    .getElementById("clearHistoryBtn")
    .addEventListener("click", () => {

        const sales = getSales();

        if (sales.length === 0) {
            return;
        }


        if (
            !confirm(
                "Are you sure you want to delete ALL sales history?"
            )
        ) {
            return;
        }


        localStorage.removeItem(
            SALES_STORAGE_KEY
        );

        renderSalesHistory();

    });


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
|
| Important because product names/comments come from data/user input.
|
*/

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

renderCart();
renderSalesHistory();

productSearch.focus();