function checkBalance(){

    $.ajax({url: "/account/check-balance/", success: function(result){
      $("#balanceInfo").html(result);
    }});

}

function requestBalance(){

    $.ajax({type:'POST',data: { phone: $("#phone").val(), facility : $("#facility").val()},url: "/account/request-balance/", success: function(result){
      $("#balanceInfo").html(result);
    }});
}

function confirmFacility(id){

    $.ajax({url: "/order/confirm-facility/"+id, success: function(result){
      $("#confirmInfo").html(result);
    }});

}

function confirmInmate(id){

    $.ajax({url: "/order/confirm-inmate/"+id, success: function(result){
        $("#confirmInfo").html(result);
    }});

}

function confirmPhone(phone){

    $.ajax({url: "/order/confirm-phone/"+phone, success: function(result){
        $("#confirmInfo").html(result);
    }});

}

function productDetails(id){

    $.ajaxSetup({
        beforeSend:function(){
            // show image here
            $("#productDetails").html('<div class="col-lg-8 col-offset-4 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x" aria-hidden="true"></i></div>');
        }

    });

    $.ajax({url: "/order/product-details/"+id, success: function(result){
      $("#productDetails").html(result);
    }});

}

function productTotalizer(){

    var deposit = Number($("#deposit").val());
    var fee = Number($("#fee").val());

    $("#total").val( (fee + deposit).toFixed(2) );

}

function confirmProduct(){

    var total = Number($("#total").val());
    var deposit = Number($("#deposit").val());
    var product = $("#product").val();

    if( (deposit >= 1 && deposit <= 50) && (product == 1 || product == 2 || product == 3) ){

        $.ajax({url: "/order/confirm-product/"+product+"/deposit/"+deposit, success: function(result){
          $("#confirmInfo").html(result);
        }});

        $("#productDetails").html('');

        $("#confirmModal").modal();


    }
    else if((deposit >= 1 && deposit <= 50) && product == 4 && $("#deposit").val().match(/^[1-50](?:|\.50|\.5|)$/)  ){
        $.ajax({url: "/order/confirm-product/"+product+"/deposit/"+deposit, success: function(result){
            $("#confirmInfo").html(result);
          }});
  
          $("#productDetails").html('');
  
          $("#confirmModal").modal();
    }
    else{

        if(product == 4){
            $("#message").html('<div class="alert alert-danger"><strong>Error!</strong> Deposit must be between $1 and $50 and in increments of $0.50.</div>');
        }
        else{
            $("#message").html('<div class="alert alert-danger"><strong>Error!</strong> Deposit must be between $1 and $50.</div>');
        }
        
    }
}


function validatePayment(){

    var validCC = $('#credit-card').validateCreditCard();
    var expDate = $("#exp-month").val() +"/"+ $("#exp-year").val();
    var filter = new RegExp("(0[123456789]|10|11|12)([/])([1-2][0-9][0-9][0-9])");
    var cvv = $("#cvc").val();

    var ccValidator = $('#credit-card').validateCreditCard();


    if(ccValidator.valid == true && filter.test(expDate) == true && (cvv.length == 3 || cvv.length == 4)){

        if ($("#msg").is(":visible")) {
             $("#msg").fadeOut(400);
        }

        return true;
    }
    else{

        if ($("#msg").is(":visible")) {
             $("#msg").fadeOut(400);
        }

        $("#msg").html('');


        if(ccValidator.valid == false){
              $("#msg").append('<div class="alert alert-danger"><strong>Credit Card Error!</strong> Please Enter a valid credit card.<div>');
        }
        if(filter.test(expDate) == false){
              $("#msg").append('<div class="alert alert-danger"><strong>Expiration Error!</strong> Please Enter a valid expiration date.<div>');
        }
        if(cvv.length <= 2){
              $("#msg").append('<div class="alert alert-danger"><strong>CVC Error!</strong> A valid CVV is 3 or 4 characters in length!<div>');
        }
        $("#msg").fadeIn(400);

        return false;

    }

}
