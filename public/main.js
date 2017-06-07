(function($) {

  $(function(){
    $("#upload-form input:file").change(function (){
      var fileName = $(this).val();
      $("#upload-form").submit();
    });
  })

})(jQuery);
