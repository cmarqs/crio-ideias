/**
 * GET /
 * Ideas
 */
exports.idea = (req, res) => {
    res.render('ideas', {
      title: 'Crio Ideias'
    });
  };
  