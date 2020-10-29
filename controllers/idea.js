const validator = require('validator');
const Idea = require('../models/Idea');
const moment = require('moment')

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
            has_interest = idea.interest.find(i => String(i.user_id_interested) == String(req.user._id))
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
  //console.log(`\nInteressado na ideia: ${req.body.idea_id} - usuario: ${req.user._id} - interessado? ${req.body.interested}`)
  const validationErrors = [];
  if (!req.isAuthenticated()) { req.flash('info', { msg: 'Por favor, faça sua identificação.' }); res.redirect('/'); }
  if (validator.isEmpty(req.body.idea_id)){    validationErrors.push({ msg: 'Erro: Ideia não selecionada.'});  }
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/');
  }
  
  Idea.findById(req.body.idea_id, (err, idea) => {
    if (err) { console.log(err); return next(err); }

    if (!idea.interest || !idea.interest.id(req.body.interested)){
        idea.interest.push(
          {
            user_id_interested: req.user._id,
            moment_registered: moment()
          }
        );
    }
    else{
      idea.interest.id(req.body.interested).remove();
    }
    
    idea.save((err) => {
      if (err){
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Você já registrou interesse nesta ideia.' });
          return res.redirect('/');
        }
        console.log(err);
        return next(err);
      }
      req.flash('sucess', { msg: 'Seu interesse nesta ideia foi registrado.'})
      res.redirect('/');
    });
  });
}


/** ADMIN AREA ********************************************************/

/**
 * Lista ideias cadastradas para admin
 */
exports.listIdeas = (req, res, next) => {
  const validationErrors = [];
  if (validationErrors.length){
    req.flash('errors', validationErrors);
    return res.redirect('/');
  }

  Idea.find()
  .then(data => {
    res.render('admin/ideas', {
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
 * POST /idea
 * Create a new idea by admin
 */
exports.saveIdea = (req, res, next) => {
  console.log(req.body)

  const validationErrors = [];
  if (!validator.isLength(req.body.title, { min:0, max: 50})) 
    validationErrors.push({ msg: 'Um título deve ser informado e deve conter no máximo 50 caracteres.'});
  if (validator.isEmpty(req.body.short_description))
   validationErrors.push({ msg: 'Por favor escreva algum resumo.'});

  if (validationErrors.length){
    console.log(JSON.stringify(validationErrors))
    req.flash('errors', validationErrors);
    return res.redirect('/')
  }

  const idea = new Idea({
    title: req.body.title,
    short_description: req.body.short_description,
    details: req.body.details,
    img_url: req.body.img_url,
    enable: req.body.enable ? (req.body.enable = 'on' ? true : false) : false,
    published_date: moment(),
    user_id_created: req.user_id,
  });

  idea.save(idea)
    .then(data => {
      res.redirect('/admin/ideas');
    })
    .catch(err => {
      req.flash('errors', { msg: 'Some error has occurred.'});
      console.log(err);
      return next(err);
    });
};