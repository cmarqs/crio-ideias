//const { blogger } = require("googleapis/build/src/apis/blogger");

/* eslint-env jquery, browser */
$(document).ready(() => {

  function executaAcoes(event) {

    // console.log(event)

    const originButton = event.target.name;
    console.log('originButton: ' + originButton)
    if (!originButton)
      return;

    switch (originButton) {
      case 'btnNovaIdeia':
        //se Nova Ideia - 1) esconde lista; 2) mostra form; 3) limpa form
        togglePanels(false);
        limpaForm();
        break;

      case 'btnEdit':
      //se edita ideia - 1) esconde lista; 2) mostra form; 3) preenche form
        togglePanels(false);
        preencheForm(originButton.id);
        break;
      
      case 'btnDelete':
      //se delete ideia - 1) exibe modal
        showModalDelete();
        break;

      case 'btnVoltar':
      //se grava/volta ideia - 1) esconde form; 2) mostra lista;
        togglePanels(true)
        limpaForm();
        break;
      default:
        togglePanels(true);
        limpaForm();
        break;
    }
  }

  /**
   * exibe lista - esconde form (vice-versa)
   */
  function togglePanels(showLista) {
    const divLista = document.querySelector('div#lista');
    const divFormulario = document.querySelector('div#formulario');

    divLista.style.display = showLista ? 'block' : 'none';
    divFormulario.style.display = showLista ? 'none' : 'block';
  }

  /**
   * Limpa form
   */
  function limpaForm() {
    const form = document.querySelector('form');

    if (form)
      form.reset();
  }

  function showModalDelete() {
    
  }

  /**
   * Preenche form
   */
  function preencheForm(idea_id) {
      
  }

  /**
   * Salva dados
   */
  function salvaDados() {
    
  }


  // events
  const btnNovaIdeia = document.getElementsByName("btnNovaIdeia");
  const btnVoltar = document.getElementsByName("btnVoltar");
  const btnEdit = document.getElementsByName("btnEdit");
  const btnDelete = document.getElementsByName("btnDelete");
  
  btnNovaIdeia[0].addEventListener('click', executaAcoes);
  btnVoltar[0].addEventListener('click', executaAcoes);
  btnEdit[0].addEventListener('click', executaAcoes);
  btnDelete[0].addEventListener('click', executaAcoes);
});
