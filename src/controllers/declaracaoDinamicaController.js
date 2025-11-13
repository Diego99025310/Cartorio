const testarDeclaracao = async (req, res) => {
  const { declaracaoSubstituida } = res.locals;
  return res.json({ resultado: declaracaoSubstituida || '' });
};

module.exports = { testarDeclaracao };
