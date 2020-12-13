const { compile } = require('nexe')
compile({
    input: './bin/echobot.js',
    build: true, //required to use patches
    
    ico: './vtrpc.ico', 
    verbose: true
  }).then(() => {
    console.log('success')
  }).catch(err=>{
      console.log(err)
  })