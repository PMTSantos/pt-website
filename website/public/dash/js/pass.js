let parametros = {
  countar : false,
  letras : false,
  numeros : false,
  carespecial : false
}
let BarraSeg = document.getElementById("seguranca");

function strengthChecker(){
  let password = document.getElementById("password").value;

  parametros.letras = (/[A-Za-z]+/.test(password))?true:false;
  parametros.numeros = (/[0-9]+/.test(password))?true:false;
  parametros.carespecial = (/[!\"$%&/()=?@~`\\.\';:+=^*_-]+/.test(password))?true:false;
  parametros.countar = (password.length > 7)?true:false;

  let tamanhoBar = Object.values(parametros).filter(value=>value);

  console.log(Object.values(parametros), tamanhoBar);

  BarraSeg.innerHTML = "";
  for( let i in tamanhoBar){
      let span = document.createElement("span");
      span.classList.add("strength");
      BarraSeg.appendChild(span);
  }

  let spanRef = document.getElementsByClassName("strength");
  for( let i = 0; i < spanRef.length; i++){
      switch(spanRef.length - 1){
          case 0 :
              spanRef[i].style.background = "#ff3e36";
              break;
          case 1:
              spanRef[i].style.background = "#ff691f";
              break;
          case 2:
              spanRef[i].style.background = "#ffda36";
              break;
          case 3:
              spanRef[i].style.background = "#0be881";
              break;
      }
  }
}

