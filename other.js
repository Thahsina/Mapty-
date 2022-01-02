const firstName = 'thahsina';
// firstNme is in global scope
// firstName gets accessed from script.js file while months cannot be accessed here in other.js , this is because other.js has been loaded before script.js in index.html so the variable firstName is loaded from other.js and ready to be used for script.js.
// other.js isnt aware of months coz months if from script.js which has been loaded later.
console.log(months);