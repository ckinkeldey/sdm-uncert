<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Experiment</title>
        <link rel="stylesheet" type="text/css" href="css/format.css" />
    </head>
    <body>
	    
    <?php 
  
            include 'connect_db.php';
            $db_table = 'questionnaire';
            

            $inserts[] = "age=" . $_POST['age'];
	    $inserts[] = "user_id=\"" . $_POST['userid']. "\"";
            $inserts[] = "sex=\"" . $_POST['sex'] . "\"";
	    $inserts[] = "topDegree=\"" . htmlspecialchars($_POST['topDegree']) ."\"";
	    $inserts[] = "otherDegree=\"" . htmlspecialchars($_POST['otherDegree']) ."\"";
            $inserts[] = "discipline=\"" . htmlspecialchars($_POST['discipline']) ."\"";
            $inserts[] = "cartogisstudy=\"" . $_POST['cartogisstudy'] . "\"";
            $inserts[] = "maths=\"" . htmlspecialchars($_POST['maths'])."\"";
            $inserts[] = "language=\"" . $_POST['language'] . "\"";
            $inserts[] = "firstlanguage=\"" . htmlspecialchars($_POST['firstlanguage'])."\"";
	    $inserts[] = "colorblind=\"" . $_POST['colorblind'] . "\"";
	    $inserts[] = "fvalidity=\"" . htmlspecialchars($_POST['fvalidity'])."\"";
            $inserts[] = "comments=\"" . htmlspecialchars($_POST['comments'])."\"";
            $inserts[] = "bushfireexp=\"" . htmlspecialchars($_POST['bushfireexp'])."\"";
	    $inserts[] = "prefer1=" . $_POST['prefer1'];
	    $inserts[] = "prefer2=" . $_POST['prefer2'];
	    $inserts[] = "prefer3=" . $_POST['prefer3'];
	    $inserts[] = "prefer4=" . $_POST['prefer4'];
	    $inserts[] = "prefer5=" . $_POST['prefer5'];
	    $inserts[] = "prefer6=" . $_POST['prefer6'];
            
              
            $insert = "insert into $db_table set " . join(",", $inserts);
            $con = mysql_connect($db_host, $db_user, $db_pass);
            if (!$con) {
            	echo "user id: " . $_POST['userid'] . "<br>";
            	echo "# not blocked: " . $_POST['numnotblocked'] . "<br>";
            	echo "Request: " . $insert . "<br>";
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
            
    ?>
  	
	<p>Thank you for participating!</p>
	<?php 
		echo $_POST['numnotblocked'] . " of your routes were not blocked.<br>";
		echo "You receive a base payment of $7 ";
		$sum = 7 + $_POST['numnotblocked'] * 0.2;
		echo "plus " . $_POST['numnotblocked'] . " x 20 ct,<br><br><b>$" . number_format($sum,2) . " in total.</b>";
	?>
    </body>
</html>


