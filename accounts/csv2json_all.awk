BEGIN{
  FS=","
  print "{ \"tasks\": ["
}
$4=="true"{ 
  if (NR>1) { printf "," }
  print "{ \"mint\":\""$2"\" }" 
}
END{
  print "] }"
}