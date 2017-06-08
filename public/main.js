(function($) {

  $(function(){
    $("#upload-form input:file").change(function (){
      var fileName = $(this).val();
      $.LoadingOverlay("show");
      $("#upload-form").submit();
    });
  })

})(jQuery);
