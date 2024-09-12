<script>
  // Function to position the profile box inline with the header avatar
  function positionProfileBox() {
    var headerAvatar = document.getElementById('header-avatar');
    var profileBox = document.getElementById('profile-box');
    var headerAvatarRect = headerAvatar.getBoundingClientRect();
    var headerRect = document.getElementById('hdr').getBoundingClientRect();

    var profileBoxTop = headerAvatarRect.top - headerRect.top + (headerAvatarRect.height / 2) - (profileBox.offsetHeight / 2);
    profileBox.style.top = profileBoxTop + 'px';
  }

  // Adjust position on window resize
  window.addEventListener('resize', positionProfileBox);

  // Initial position
  document.addEventListener('DOMContentLoaded', positionProfileBox);

  document.getElementById('show').addEventListener('mouseover', function () {
    document.getElementById('profile-box').style.display = 'flex';
  });
  document.getElementById('show').addEventListener('mouseout', function () {
    document.getElementById('profile-box').style.display = 'none';
  });
</script>