const validator = require('validator');
const Idea = require('../models/Idea');
const moment = require('moment');
const { data } = require('jquery');
const User = require('../models/User');
const { UserPage } = require('twilio/lib/rest/chat/v1/service/user');

exports.findAllIdeas = (req, res, next) => {
  const chunk = (arr, chunkSize) => {
    var R = [];
    for (var i=0,len=arr.length; i<len; i+=chunkSize)
      R.push(arr.slice(i,i+chunkSize));
    return R;
  }

  Idea.find()
      .then(data => {
        //fill object to view
        const viewData = [];
        data.forEach(idea => {
          const newData = {};

          //if has user authenticated, get the ideas hi got interested
          let has_interest;
          if (idea.interest && req.isAuthenticated()){
            has_interest = idea.interest.find(i => String(i.user_interested._id) == String(req.user._id))
          }
          
          newData.interested = has_interest ? has_interest._id : '';
          newData.qtt_interest = idea.interest.length;
          newData.id = idea._id;
          newData.title = idea.title;
          newData.short_description = idea.short_description;
          newData.img_url = (idea.img_url ? idea.img_url:"https://images.tcdn.com.br/img/img_prod/837998/180_cafe_blend_da_semana_1_1_20200728204612.jpg");

          viewData.push(newData)
        });

        res.render('ideas', {
          title: 'Ideias',
          values: chunk(viewData, 2),
        });
      })
      .catch(err => {
        console.log(err);
        req.flash('errors', { msg: 'Some error has occurred.'});
        return next(err);
      })
};

exports.updateInterest = (req, res, next) => {
  console.log(`\nInteressado na ideia: ${req.body.idea_id} - usuario: ${req.user._id} - interessado? ${req.body.interested}`)
  const validationErrors = [];
  if (!req.isAuthenticated()) { req.flash('info', { msg: 'Por favor, faça sua identificação.' }); res.redirect('/'); }
  if (validator.isEmpty(req.body.idea_id)){    validationErrors.push({ msg: 'Erro: Ideia não selecionada.'});  }
  if (validationErrors.length){
    console.log('Erros')
    req.flash('errors', validationErrors);
    res.redirect('/');
  }

  Idea.findById(req.body.idea_id, (err, idea) => {
    if (err) { 
      console.log(err); 
      return next(err);
    }
    if (!idea.interest || !idea.interest.id(req.body.interested)){
        idea.interest.push(
          {
            moment_registered: moment(),
            user_interested: req.user._id
          },
        );
    }
    else{
      idea.interest.id(req.body.interested).remove();
    }
   
    idea.save((err) => {
      if (err){
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Você já registrou interesse nesta ideia.' });
          res.redirect('/');
        }
        console.log(err);
        next(err);
      }
      req.flash('sucess', { msg: 'Seu interesse nesta ideia foi registrado.'})
      res.redirect('/');
    });
  });
}


/**
 * Find ideias por ID
 */
exports.getIdeaDetails = (req, res, next) => {
  const { id } = req.params;
  console.log(req.params);
  const validationErrors = [];
  if (validator.isEmpty(id)) validationErrors.push({ msg: 'Houve uma falha ao capturar o id da ideia a ser editada. Informe o administrador.' });
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/');
  }

  function getIdea(err, idea) {
    if (err) { return next(err); }
    if (!idea) {
      req.flash('errors', { msg: 'Não encontramos a ideia passada pelo sistema. Informe o administrador sobre esse evento' });
      return res.redirect('/');
    }
    console.log(idea)
    res.render('details', {
      title: 'Ideias',
      data: idea,
    });
  }

  Idea.findById(id, getIdea)
}


/** ADMIN AREA ********************************************************/

/**
 * Lista ideias cadastradas para admin
 */
exports.listIdeas = (req, res, next) => {
  const validationErrors = [];
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/list');
  }

  Idea.find()
  .then(data => {
    res.render('admin/ideas/list', {
      title: 'Admin - Ideias',
      values: data,
    });
  })
  .catch(err => {
    console.log(err);
    req.flash('errors', { msg: 'Some error has occurred.'});
    return next(err);
  })
}

/**
 * Return empty form
 */
exports.getEmptyForm = (req, res, next) => {
  res.render('admin/ideas/form', {
    title: 'Admin - Ideias'
  })
}

/**
 * Find ideias por ID
 */
exports.getIdeaById = (req, res, next) => {
  const { id } = req.params;
  const validationErrors = [];
  if (validator.isEmpty(id)) validationErrors.push({ msg: 'Houve uma falha ao capturar o id da ideia a ser editada. Informe o administrador.' });
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/list');
  }

  function getIdea(err, idea) {
    if (err) { return next(err); }
    if (!idea) {
      req.flash('errors', { msg: 'Não encontramos a ideia passada pelo sistema. Informe o administrador sobre esse evento' });
      return res.redirect('/admin/ideas/list');
    }
    res.render('admin/ideas/form', {
      title: 'Admin - Ideias',
      data: idea,
    });
  }

  Idea.findById(id, getIdea)
}

/**
 * Get Idea with User Interested Populate
 */
exports.getIdeaByIdWithInteresteds = (req, res, next) => {
  const { id } = req.params;
  const validationErrors = [];
  if (validator.isEmpty(id)) validationErrors.push({ msg: 'Houve uma falha ao capturar o id da ideia a ser editada. Informe o administrador.' });
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/list');
  }

  function getIdea(err, idea) {
    if (err) { return next(err); }
    if (!idea) {
      req.flash('errors', { msg: 'Não encontramos a ideia passada pelo sistema. Informe o administrador sobre esse evento' });
      res.redirect('/admin/ideas/');
    }

    const data = idea.interest;
    const interesteds = []
    data.forEach(i => {
      interesteds.push({
        name: (i.user_interested.profile) ? i.user_interested.profile.name : '',
        email: i.user_interested.email,
        moment_registered: i.moment_registered
      });
    })
    res.status(200).send(JSON.stringify(interesteds));
  }

  Idea.findById(id, getIdea).populate('interest.user_interested');
}

/**
 * POST /idea
 * Create a new idea by admin
 */
exports.newIdea = (req, res, next) => {
  console.log('new idea')
  
  const validationErrors = [];
  if (!validator.isLength(req.body.title, { min:0, max: 50})) 
    validationErrors.push({ msg: 'Um título deve ser informado e deve conter no máximo 50 caracteres.'});
  if (validator.isEmpty(req.body.short_description))
   validationErrors.push({ msg: 'Por favor escreva algum resumo.'});

  if (validationErrors.length){
    console.log(JSON.stringify(validationErrors))
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/')
  }

  const idea = new Idea({
    title: req.body.title,
    short_description: req.body.short_description,
    details: req.body.details,
    img_url: req.body.img_url,
    enable: req.body.enable ? (req.body.enable = 'on' ? true : false) : false,
    published_date: moment(),
    user_created: req.user._id,
  });

  console.log(idea)

  idea.save(idea)
    .then(data => {
      req.flash('success', { msg: 'Ideia inserida com sucesso!' });
      res.redirect('/admin/ideas/');
    })
    .catch(err => {
      req.flash('errors', { msg: 'Some error has occurred.'});
      console.log(err);
      return next(err);
    });
};

exports.editIdea = (req, res, next) => {
  console.log('edit idea')
  console.log(req.body);

  const id = req.params.id;

  const validationErrors = [];
  if (!id) { validationErrors.push({ msg: 'O id da ideia não foi informada pelo sistema. Acione o administrador.'}); }
  if (!validator.isLength(req.body.title, { min:0, max: 50})) { validationErrors.push({ msg: 'Um título deve ser informado e deve conter no máximo 50 caracteres.'}); }
  if (validator.isEmpty(req.body.short_description)) { validationErrors.push({ msg: 'Por favor escreva algum resumo.'});}

  if (validationErrors.length){
    console.log(JSON.stringify(validationErrors))
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/')
  }

  Idea.findById(id, (err, data) => {
    if (err) { return next(err); }

    data.title = req.body.title;
    data.short_description = req.body.short_description;
    data.details = req.body.details ? req.body.details : '';
    data.img_url = req.body.img_url ? req.body.img_url : '';
    data.enable = req.body.enable ? (req.body.enable = 'on' ? true : false) : false;
    data.save((err) => {
      if (err){
        return next(err);
      }
      req.flash('success', { msg: 'Informações da ideia atualizadas.' });
      res.redirect('/admin/ideas');
    });
  });
}

exports.deleteIdea = (req, res, next) => {
  console.log('delete idea')
  console.log(req.body);

  const id = req.params.id;

  const validationErrors = [];
  if (!id) { validationErrors.push({ msg: 'O id da ideia não foi informada pelo sistema. Acione o administrador.'}); }

  if (validationErrors.length){
    console.log(JSON.stringify(validationErrors))
    req.flash('errors', validationErrors);
    return res.redirect('/admin/ideas/')
  }

  Idea.findByIdAndDelete(id)
  .then(data => {
    if (!data) {
      res.status(404).send({
        message: `A ideia id=${id} não foi encontrada. Informe o erro ao Administrador.`
      });
    } 
    req.flash('success', { msg: 'Ideia deletada com sucesso!' });
    res.redirect('/admin/ideas/');
  })
  .catch(err => {
    req.flash('errors', { msg: 'Falha ao deletar ideia id=' + id});
    res.status(500).send({
      message: `A ideia id=${id} não foi deletada. ${err.message}`
    })
    console.log(err);
    return next(err);
  });
}
