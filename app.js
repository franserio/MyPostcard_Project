const urlAPI = "https://appdsapi-6aa0.kxcdn.com/content.php";
const urlMPCServer = "https://www.mypostcard.com/mobile/product_prices.php";
const maxRows = 25;
const specialRow = 4;

// setting = designCallRequestParameters - DONE
let designsCallRequestParameters = {
    lang: "de",
    json: 1,
    search_text: "berlin",
    currencyiso: "EUR",
};

// priceCallRequestParameters - DONE
let priceCallRequestParameters = {
    json: 1,
    type: "get_postcard_products",
    currencyiso: "EUR",
    store_id: "",
};

// TODO: ver nombre item
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
        priceCallRequestParameters.store_id = item.id;
        //Setup proxy server API request in order to solve CORS
        // $.ajaxPrefilter((options) => {
        //     if (options.crossDomain && jQuery.support.cors) {
        //         let http = window.location.protocol === "http:" ? "http:" : "https:";
        //         options.url = `${http}//cors-anywhere.herokuapp.com/${options.url}`;
        //     }
        // });
        //Call to proxy server API with custom url
        $.ajax({
            // method: "GET",
            // Call proxy server API with custom request in order to solve CORS
            url: `https://cors-anywhere.herokuapp.com/${urlMPCServer}`,
            data: priceCallRequestParameters,
        })
            .done((responseById) => {
                renderPrice(responseById, item);
            })
            .fail((_req, status, err) => {
                console.log("Something went wrong... ", status, err);
            });
    });
}

function renderOption(textToDisplay, value) {
    return $("<option>").text(textToDisplay).attr("value", value);
}

function renderPrice(response, item) {
    $("#" + item.id).append(
        $("<td>")
            .text("€ ")
            .append(
                $("<span>")
                    .text(function () {
                        let priceWithEnvelope = 0;
                        $.each(response.products, (_key, designType) => {
                            if (designType.assignedtype === "Greetcard") {
                                priceWithEnvelope =
                                    parseFloat(designType.price) +
                                    parseFloat(designType.product_options["Envelope"].price);
                            }
                        });
                        return priceWithEnvelope;
                    })
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
                // TODO: display correct price default (folding and audio)
                // TODO: create function for every append - DONE
                options = response.products;
                let $select = $("<select>");
                $select.addClass("custom-select");
                // TODO: variables names
                $.each(options, (_key, product) => {
                    if (product.assignedtype === "Greetcard") {
                        $.each(product.product_options, (i, item) => {
                            $select.append(renderOption(`Greeting card - ${i}`, item.option_code));
                        });
                    } else if (product.assignedtype === "Greetcard_Folding") {
                        $.each(product.product_options, (i, item) => {
                            $select.append(renderOption(`Folding card - ${i}`, item.option_code));
                        });
                    } else if (product.assignedtype === "Greetcard_Audio") {
                        $.each(product.product_options, (i, item) => {
                            $select.append(renderOption(`Audio card - ${i}`, item.option_code));
                        });
                    }
                });

                // $select.append(renderOption("Only Folding Card", 0));
                // $select.append(renderOption("Only Audio Card", 0));
                $select.prop("selectedIndex", 2);
                // Add sort logic here (Greeting card with Envelope first)
                return $select;
            })
            .addClass("align-middle")
    );
}

let response = $.ajax({
    // method: "GET",
    url: urlAPI,
    data: designsCallRequestParameters,
})
    .done((response) => {
        $.each(response.content, (i, item) => {
            if (i < maxRows) {
                renderTableContent(item);
                fetchItem(item);
            }
            $(`tr:nth-of-type(${specialRow})`).addClass("special-row");
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
        // New request with specific id (not for all)
        priceCallRequestParameters.store_id = designId;
        $.ajax({
            url: `https://cors-anywhere.herokuapp.com/${urlMPCServer}`,
            data: priceCallRequestParameters,
        })
            .done((response) => {
                console.log(response);
                let productsByDesign = response.products;
                $.each(productsByDesign, (_i, item) => {
                    $.each(item.product_options, (_key, addOnProduct) => {
                        if (addOnProduct.option_code === value) {
                            $(`#${designId} .price`).text(parseFloat(item.price) + parseFloat(addOnProduct.price));
                        }
                    });
                });
            })
            .fail((_req, status, err) => {
                console.log("Something went wrong", status, err);
            });
    });
});
