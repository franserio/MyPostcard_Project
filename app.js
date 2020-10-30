const urlAPI = "https://appdsapi-6aa0.kxcdn.com/content.php";
const urlMPCServer = "https://www.mypostcard.com/mobile/product_prices.php";
const maxRows = 25;
const specialRow = 4;
let indexOptions = [];

let designsCallRequestParameters = {
    lang: "de",
    json: 1,
    search_text: "berlin",
    currencyiso: "EUR",
};

let priceCallRequestParameters = {
    json: 1,
    type: "get_postcard_products",
    currencyiso: "EUR",
    store_id: "",
};

// TODO: ver nombre item
function renderTableContent(postcardDesign) {
    $("#tableId").append(
        $("<tr>")
            .attr("id", postcardDesign.id)
            .append(
                $("<td>")
                    .append(
                        $("<img>").addClass("img-thumbnail").attr({
                            src: postcardDesign.thumb_url,
                            alt: postcardDesign.alt_tag,
                        })
                    )
                    .addClass("thumbnail"),
                $("<td>").text(postcardDesign.title).addClass("align-middle")
            )
    );
}

function fetchItem(postcardDesign) {
    $(() => {
        priceCallRequestParameters.store_id = postcardDesign.id;
        $.ajax({
            // Call proxy server API with custom url in order to solve CORS
            url: `http://cors-anywhere.herokuapp.com/${urlMPCServer}`,
            data: priceCallRequestParameters,
        })
            .done((responseById) => {
                renderPrice(responseById, postcardDesign);
            })
            .fail((_req, status, err) => {
                console.log("Something went wrong... ", status, err);
            });
    });
}

function renderOption(textToDisplay, value) {
    return $("<option>").text(textToDisplay).attr("value", value);
}

function renderPrice(responseById, postcardDesign) {
    $("#" + postcardDesign.id).append(
        $("<td>")
            .text("€ ")
            .append(
                $("<span>")
                    .text(() => {
                        // Display default price
                        let priceWithEnvelope = 0;
                        $.each(responseById.products, (_key, designType) => {
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
                postcardDesignTypes = responseById.products;
                let $select = $("<select>");
                $select.addClass("custom-select");
                // TODO: variables names
                $.each(postcardDesignTypes, (_key, postcardDesignType) => {
                    if (postcardDesignType.assignedtype === "Greetcard") {
                        $.each(postcardDesignType.product_options, (indexAddOn, postcardAddOn) => {
                            indexOptions.push(indexAddOn);
                            $select.append(renderOption(`Greeting card - ${indexAddOn}`, postcardAddOn.option_code));
                        });
                        $select.append(renderOption("Only Greeting Card", postcardDesignType.assignedtype));
                    } else if (postcardDesignType.assignedtype === "Greetcard_Folding") {
                        $.each(postcardDesignType.product_options, (indexAddOn, postcardAddOn) => {
                            indexOptions.push(indexAddOn);
                            $select.append(renderOption(`Folding card - ${indexAddOn}`, postcardAddOn.option_code));
                        });
                        $select.append(renderOption("Only Folding Card", postcardDesignType.assignedtype));
                    } else if (postcardDesignType.assignedtype === "Greetcard_Audio") {
                        $.each(postcardDesignType.product_options, (indexAddOn, postcardAddOn) => {
                            indexOptions.push(indexAddOn);
                            $select.append(renderOption(`Audio card - ${indexAddOn}`, postcardAddOn.option_code));
                        });
                        $select.append(renderOption("Only Audio Card", postcardDesignType.assignedtype));
                    }
                });

                $select.prop("selectedIndex", indexOptions.indexOf("Envelope"));
                indexOptions = [];
                return $select;
            })
            .addClass("align-middle")
    );
}

let response = $.ajax({
    url: urlAPI,
    data: designsCallRequestParameters,
})
    .done((response) => {
        $.each(response.content, (indexDesign, postcardDesign) => {
            if (indexDesign < maxRows) {
                renderTableContent(postcardDesign);
                fetchItem(postcardDesign);
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
        // New request with specific id
        priceCallRequestParameters.store_id = designId;
        $.ajax({
            url: `https://cors-anywhere.herokuapp.com/${urlMPCServer}`,
            data: priceCallRequestParameters,
        })
            .done((responseById) => {
                let postcardDesignTypes = responseById.products;
                $.each(postcardDesignTypes, (_i, postcardDesignType) => {
                    if (postcardDesignType.assignedtype === value) {
                        $(`#${designId} .price`).text(parseFloat(postcardDesignType.price));
                    } else {
                        $.each(postcardDesignType.product_options, (_key, addOnProduct) => {
                            if (addOnProduct.option_code === value) {
                                $(`#${designId} .price`).text(
                                    parseFloat(postcardDesignType.price) + parseFloat(addOnProduct.price)
                                );
                            }
                        });
                    }
                });
            })
            .fail((_req, status, err) => {
                console.log("Something went wrong", status, err);
            });
    });
});
