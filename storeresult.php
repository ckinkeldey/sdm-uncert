<script language="php">
    
    ini_set('display_errors', 1); 
	error_reporting(E_ALL); 

    //get data from URL
    $amt_id=$_GET["amt_id"];
    $timestamp=$_GET["timestamp"];
    $pctime=$_GET["pctime"];
    $scenario_id=$_GET["scenario_id"];
    $coords=$_GET["coords"];
    $total_risk=$_GET["total_risk"];
    $distance=$_GET["distance"];
    $outcome=$_GET["outcome"];
    
    // include db connection parameters
    include 'connect_db_server.php';
    $db_table = 'user_data';
    
    // connect to db
    $con = mysql_connect($db_host, $db_user, $db_pass);
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    echo "<p>$con</p>";
    
    mysql_select_db($db_name, $con);
    
    // insert data into db
    $sql = "INSERT INTO $db_table (amt_id, timestamp, pctime, scenario_id, coords, total_risk, distance, outcome) VALUES
    ('" . $amt_id . "'," 
    . $timestamp . "," 
    . $pctime . "," 
    . $scenario_id . ",'"
    . $coords . "',"
    . $total_risk . ","
    . $distance . ","
    . $outcome . 
    ")";
    
    echo "<p>$sql</p>";
    
    $result = mysql_query($sql);
    if (!$result) {
     	echo '<p>Ungültige Anfrage: ' . mysql_error() . '</p>';
	}
    echo "<p>Result: $result</p>";
         
    mysql_close($con);
    echo "<p>connection closed.</p>"
    
</script>