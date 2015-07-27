<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Experiment</title>
        <link rel="stylesheet" type="text/css" href="css/format.css" />
        
    </head>
    <body>
	    
        <script language="php">
  
            include 'connect_db.php';
            $db_table = 'questionnaire';
            

            $inserts[] = "age=" . $_GET['age'];
	    $inserts[] = "user_id=\"" . $_GET['userid']. "\"";
            $inserts[] = "sex=\"" . $_GET['sex'] . "\"";
	    $inserts[] = "topDegree=\"" . htmlspecialchars($_GET['topDegree']) ."\"";
	    $inserts[] = "otherDegree=\"" . htmlspecialchars($_GET['otherDegree']) ."\"";
            $inserts[] = "discipline=\"" . htmlspecialchars($_GET['discipline']) ."\"";
            $inserts[] = "cartogisstudy=\"" . $_GET['cartogisstudy'] . "\"";
            $inserts[] = "maths=\"" . htmlspecialchars($_GET['maths'])."\"";
            $inserts[] = "language=\"" . $_GET['language'] . "\"";
            $inserts[] = "firstlanguage=\"" . htmlspecialchars($_GET['firstlanguage'])."\"";
	    $inserts[] = "colorblind=\"" . $_GET['colorblind'] . "\"";
	    $inserts[] = "fvalidity=\"" . htmlspecialchars($_GET['fvalidity'])."\"";
            $inserts[] = "comments=\"" . htmlspecialchars($_GET['comments'])."\"";
            $inserts[] = "bushfireexp=\"" . htmlspecialchars($_GET['bushfireexp'])."\"";
	    $inserts[] = "prefer1=" . $_GET['prefer1'];
	    $inserts[] = "prefer2=" . $_GET['prefer2'];
	    $inserts[] = "prefer3=" . $_GET['prefer3'];
	    $inserts[] = "prefer4=" . $_GET['prefer4'];
	    $inserts[] = "prefer5=" . $_GET['prefer5'];
	    $inserts[] = "prefer6=" . $_GET['prefer6'];
            
              
            $insert = "insert into $db_table set " . join(",", $inserts);

            
            $con = mysql_connect($db_host, $db_user, $db_pass);
            if (!$con) {
                die('Could not connect to database: ' . mysql_error());
            }
            
            mysql_select_db($db_name, $con);
            
            if (mysql_query($insert, $con)) {
                echo "Your results were successfully stored!";    
            }
            else {
                echo "ERROR - " . mysql_error();
            }    
                
            mysql_close($con);
            
        </script>
  	
	<p>Thank you for participating!</p>
	<?php 

		echo  $_GET['numnotblocked'] . " of your routes were not blocked.<br>";
		echo "You receive a base payment of $7 ";
		$sum = 7+$_GET['numnotblocked']*0.2;
		echo "plus " . $_GET['numnotblocked'] . " x 20 ct,<br><br><b>$" . number_format($sum,2) . " in total.</b>";
	?>
    </body>
</html>


