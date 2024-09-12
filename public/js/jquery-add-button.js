<script>
  $(document).ready(function() {
    $('#addStockBtn').click(function() {
      var symbol = $(this).data('symbol');
      console.log('Button clicked. Symbol:', symbol);

      $.ajax({
        type: 'POST',
        url: '/stocks/user-stocks', // Ensure this matches the server-side route
        data: { search: symbol },
        success: function(response) {
          console.log('Stock added successfully:', response);
          // Optionally, update the UI or notify the user
        },
        error: function(error) {
          console.error('Error adding stock:', error);
        }
      });
    });
  });
</script>