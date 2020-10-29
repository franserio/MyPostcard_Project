const urlAPI = "https://appdsapi-6aa0.kxcdn.com/content.php";
const urlMPCServer = "https://www.mypostcard.com/mobile/product_prices.php";
const maxRows = 25;

let settings = {
    lang: "de",
    json: 1,
    search_text: "berlin",
    currencyiso: "EUR",
};

let priceCallSettings = {
    json: 1,
    type: "get_postcard_products",
    currencyiso: settings.currencyiso,
    store_id: "",
};

function renderTableContent(item) {
    $("#tableId").append(
        $("<tr>")
            .attr("id", item.id)
            .append(
                $("<td>")
                    .append(
                        $("<img>").addClass("img-thumbnail").attr({
                            src: item.thumb_url,
                            alt: item.alt_tag,
                        })
                    )
                    .addClass("thumbnail"),
                $("<td>").text(item.title).addClass("align-middle")
            )
    );
}

function fetchItem(item) {
    $(function () {
        priceCallSettings.store_id = item.id;
        //Setup proxy server API request in order to solve CORS
        $.ajaxPrefilter((options) => {
            if (options.crossDomain && jQuery.support.cors) {
                let http = window.location.protocol === "http:" ? "http:" : "https:";
                options.url = `${http}//cors-anywhere.herokuapp.com/${options.url}`;
            }
        });
        //Call to proxy server API with custom url
        $.ajax({
            url: urlMPCServer,
            data: priceCallSettings,
        })
            .done((response) => {
                renderPrice(response, item);
            })
            .fail((_req, status, err) => {
                console.log("Something went wrong... ", status, err);
            })
            .always(function () {});
    });
}

function renderPrice(response, item) {
    $("#" + item.id).append(
        $("<td>")
            .text("€ ")
            .append(
                $("<span>")
                    .text(
                        parseFloat(response.products[0].price) +
                            parseFloat(response.products[0].product_options.Envelope.price)
                    )
                    .addClass("price")
            )
            .addClass("align-middle"),
        $("<td>")
            .append(() => {
                // Options only for Greeting card
                // options = response.products[0].product_options;
                // let $select = $("<select></select>");
                // $select.addClass("custom-select");
                // $.each(options, (i, item) => {
                //     $select.append($("<option>").text(i).attr({ value: item.price }));
                // });

                // Options for all products (greeting, folding and audio)
                options = response.products;
                let $select = $("<select></select>");
                $.each(options, function (key, product) {
                    $.each(product.product_options, function (i, item) {
                        if (key === 0) {
                            $select.append($("<option>").text(`Greeting card - ${i}`).attr({ value: item.price }));
                        } else if (key === 1) {
                            $select.append($("<option>").text(`Folding card - ${i}`).attr({ value: item.price }));
                        } else {
                            $select.append($("<option>").text(`Audio card: ${i}`).attr({ value: item.price }));
                        }
                    });
                });
                $select.append($("<option>").text("Only Folding Card").attr({ value: 0 }));
                $select.append($("<option>").text("Only Audio Card").attr({ value: 0 }));
                $select.append($("<option>").text("Only Greeting Card").attr({ value: 0 })).prop("selectedIndex", 2);
                // Add sort logic here (Greeting card with Envelope first)
                return $select;
            })
            .addClass("align-middle")
    );
}

let response = $.ajax({
    url: urlAPI,
    data: settings,
})
    .done((response) => {
        $.each(response.content, (i, item) => {
            if (i < maxRows) {
                renderTableContent(item);
                fetchItem(item);
            }
            $("tr:nth-of-type(4)").addClass("specialRow");
        });
    })
    .fail((_req, status, err) => {
        console.log("Something went wrong", status, err);
    });

$(document).ready(() => {
    // Modify price when user select another option
    $("#tableId").on("change", "select", function () {
        let value = $(this).val();
        let designId = $(this).parent().parent().attr("id");
        let content = response.responseJSON.content;
        console.log(designId);
        // New request with specific id (not for all)
        $.each(content, (_i, item) => {
            if (item.id === designId) {
                $(`#${designId} .price`).text(parseFloat(item.price) + parseFloat(value));
            }
        });
    });
});
