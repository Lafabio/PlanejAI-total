let habilidades = [];
let selecionada = null;

// 🔹 Carregar BNCC
async function carregar() {
  const res = await fetch("bncc.json");
  habilidades = await res.json();
}

carregar();

// 🔍 Filtro
function filtrar() {
  const termo = document.getElementById("busca").value.toLowerCase();

  const lista = habilidades.filter(h =>
    h.codigo.toLowerCase().includes(termo) ||
    h.descricao.toLowerCase().includes(termo)
  );

  render(lista);
}

// 📋 Render lista
function render(lista) {
  const div = document.getElementById("lista");
  div.innerHTML = "";

  lista.slice(0, 20).forEach(h => {
    const el = document.createElement("div");
    el.innerHTML = `<b>${h.codigo}</b> - ${h.descricao}`;
    el.onclick = () => selecionar(h);
    div.appendChild(el);
  });
}

// ✅ Selecionar
function selecionar(h) {
  selecionada = h;
  document.getElementById("codigo").innerText = h.codigo;
  document.getElementById("texto").innerText = h.descricao;
}

// 🤖 Gerar plano
async function gerarPlano() {

  if (!selecionada) {
    alert("Selecione uma habilidade!");
    return;
  }

  const prompt = `
Crie um plano de aula baseado na BNCC:

${selecionada.codigo} - ${selecionada.descricao}

Inclua:
Objetivo
Conteúdo
Metodologia
Atividade
Avaliação
TDAH
Tarefa
`;

  document.getElementById("status").innerText = "Gerando...";

  const resposta = await chamarIA(prompt);

  preencher(resposta);
}

// 🔌 Gemini
async function chamarIA(prompt) {

  const API_KEY = "COLE_SUA_CHAVE_AQUI";

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await res.json();

  return data.candidates[0].content.parts[0].text;
}

// ✂️ Separar texto
function pegar(txt, nome) {
  const r = new RegExp(nome + ":(.*?)(?=\\n\\w|$)", "is");
  const m = txt.match(r);
  return m ? m[1].trim() : "";
}

// 📥 Preencher campos
function preencher(txt) {
  document.getElementById("objetivo").value = pegar(txt, "Objetivo");
  document.getElementById("conteudo").value = pegar(txt, "Conteúdo");
  document.getElementById("metodologia").value = pegar(txt, "Metodologia");
  document.getElementById("atividade").value = pegar(txt, "Atividade");
  document.getElementById("avaliacao").value = pegar(txt, "Avaliação");
  document.getElementById("adaptacao").value = pegar(txt, "TDAH");
  document.getElementById("tarefa").value = pegar(txt, "Tarefa");

  document.getElementById("status").innerText = "✅ Plano gerado!";
}