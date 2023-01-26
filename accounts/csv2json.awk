BEGIN{
  FS=","
  print "{ \"tasks\": ["
}
{ 
  if (NR>1) { printf "," }
  print "{ \"mint\":\""$1"\" }" 
}
END{
  print "] }"
}