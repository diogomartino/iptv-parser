<?php
$string = $_POST['list'];
$myFile = fopen('iptv.txt', 'w');

fwrite($myFile, $string);
fclose($myFile);
