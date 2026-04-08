// ===== HABILIDADES_DB (mantido igual) =====
var HABILIDADES_DB = [ /* ... todo o array que você enviou ... */ ];

// ===== STATE =====
var ST = { areas:[], bloomLevel:0, methods:[], instrs:[], currentHab:null };
var bloomNames = {1:'Lembrar',2:'Compreender',3:'Aplicar',4:'Analisar',5:'Avaliar',6:'Criar'};
var bloomClasses = {1:'bl1-bg',2:'bl2-bg',3:'bl3-bg',4:'bl4-bg',5:'bl5-bg',6:'bl6-bg'};

// ===== NAV =====
var pct = [16,33,50,66,83,100];
function goTo(n){
  document.querySelectorAll('.page').forEach((p,i)=>p.classList.toggle('active',i===n));
  document.querySelectorAll('.nav-step').forEach((s,i)=>{s.classList.remove('active','done');if(i===n)s.classList.add('active');else if(i<n)s.classList.add('done');});
  document.getElementById('progressFill').style.width=pct[n]+'%';
  if(n===5) updatePreview();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ===== Funções auxiliares (toggleArea, selectBloom, skill selector, etc.) =====
// (mantidas iguais ao original - cole aqui todas as funções que estavam no seu arquivo)

// ===== SYS PROMPT =====
var SYS = `Você é um especialista em BNCC, CBTC e Taxonomia de Bloom para o Ensino Médio e EJA. Regras invioláveis: 1) NUNCA troque o verbo da habilidade. 2) Conteúdos devem permitir exercer o verbo. ...`; // mantenha o SYS completo que você tinha

// ===== GEMINI CORRIGIDO =====
var GEMINI_API_KEY = '';
var GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview'];

async function callGemini(prompt, modelIdx = 0){
  var key = window.GEMINI_KEY || GEMINI_API_KEY;
  if(!key) throw new Error('Chave da API Gemini não configurada. Use o painel Admin.');

  var model = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[0];
  var url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  var fullPrompt = SYS + "\n\n" + prompt;

  var body = {
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { maxOutputTokens: 3000, temperature: 0.7 }
  };

  var r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });

  if(r.status === 429){
    var next = modelIdx + 1;
    if(next < GEMINI_MODELS.length){
      await new Promise(res => setTimeout(res, 2000));
      return callGemini(prompt, next);
    }
    throw new Error('Limite de requisições atingido. Aguarde alguns minutos.');
  }

  var data = await r.json();
  if(data.candidates && data.candidates[0]?.content?.parts){
    return data.candidates[0].content.parts.map(p => p.text || '').join('');
  }
  if(data.error) throw new Error(`Gemini: ${data.error.message}`);
  throw new Error('Resposta inválida da API');
}

// ===== EXPORT DOCX CORRIGIDO =====
async function exportDocx(){
  var st = document.getElementById('st');
  var btn = document.getElementById('expBtn');
  st.className = 'status-msg';
  st.textContent = 'Gerando documento...';
  btn.disabled = true;

  try {
    var d = window.docx;
    if(!d) throw new Error('Biblioteca docx não carregada.');

    var { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign, HeightRule } = d;

    var brd = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
    var ab = { top: brd, bottom: brd, left: brd, right: brd };

    var B = (t) => new TextRun({ text: String(t||''), bold: true, font: 'Arial', size: 20 });
    var N = (t) => new TextRun({ text: String(t||''), font: 'Arial', size: 20 });

    var LC = (label) => new TableCell({
      width: { size: 2520, type: WidthType.DXA },
      borders: ab,
      shading: { fill: 'EEE8D8' },
      margins: { top: 80, bottom: 80, left: 160, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [B(label)] })]
    });

    var VC = (text) => {
      var lines = (String(text||'')).split('\n');
      var paras = lines.map(l => new Paragraph({ spacing: { before: 0, after: 40 }, children: [N(l)] }));
      if(!paras.length) paras = [new Paragraph({ children: [N('—')] })];
      return new TableCell({
        width: { size: 7830, type: WidthType.DXA },
        borders: ab,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: paras
      });
    };

    var TR = (h, cells) => new TableRow({ height: { value: h, rule: HeightRule.AT_LEAST }, children: cells });

    // Dados
    var escola = document.getElementById('escola').value || '';
    var prof = document.getElementById('professor').value || '';
    var area = ST.areas.join(', ');
    var comp = document.getElementById('componente').value || '';
    var areaFull = [area, comp].filter(Boolean).join(' — ');
    var tema = document.getElementById('temaGerador').value || '';
    var turma = document.getElementById('turma').value || '';
    var hab = getHabText() || '';
    var cont = document.getElementById('conteudo').value || '';
    var crit = getCrits().map((c,i) => (i+1)+'. '+c).join('\n') || '';
    var instr = getInstrs() || '';
    var met = document.getElementById('metodologia').value || '';
    var carga = document.getElementById('cargaHoraria').value || '';
    var refs = document.getElementById('referencias').value || '';

    var mainTable = new Table({
      width: { size: 10350, type: WidthType.DXA },
      columnWidths: [2520, 7830],
      rows: [
        TR(538, [LC('Área(s) do conhecimento/Componente curricular'), VC(areaFull)]),
        TR(546, [LC('Tema Gerador'), VC(tema)]),
        TR(398, [LC('Turma/Etapa'), VC(turma)]),
        TR(559, [LC('Habilidade(s) selecionada(s)'), VC(hab)]),
        TR(709, [LC('Objeto de conhecimento/estudo'), VC(cont)]),
        TR(1144,[LC('Critério(s) de avaliação'), VC(crit)]),
        TR(1144,[LC('Instrumento de avaliação'), VC(instr)]),
        TR(570, [LC('Caminho metodológico'), VC(met)]),
        TR(1095,[LC('Tempo de duração do plano'), VC(carga)]),
        TR(1144,[LC('Referências'), VC(refs)])
      ]
    });

    var headerTable = new Table({
      width: { size: 10343, type: WidthType.DXA },
      columnWidths: [1845, 8498],
      rows: [new TableRow({
        children: [
          new TableCell({ width: { size: 1845, type: WidthType.DXA }, borders: ab, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [N('📚')] })] }),
          new TableCell({ width: { size: 8498, type: WidthType.DXA }, borders: ab, margins: { top:60,bottom:60,left:120,right:120 }, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [B('ESTADO DE SANTA CATARINA')] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [B('SECRETARIA DE ESTADO DA EDUCAÇÃO')] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [B('ESCOLA: ' + escola)] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [B('PROFESSOR: ' + prof)] })
          ]})
        ]
      })]
    });

    var doc = new Document({
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top:426, right:707, bottom:709, left:851 } } },
        children: [
          headerTable,
          new Paragraph({ spacing: { before:80, after:40 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [B('PLANO DE AULA')] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before:0, after:60 }, children: [new TextRun({ text: 'Sistema produzido por Prof. Lafaiete Erkmann — Todos os direitos reservados.', font:'Arial', size:14, color:'888888', italics:true })] }),
          new Paragraph({ spacing: { before:40, after:0 } }),
          mainTable
        ]
      }]
    });

    var blob = await Packer.toBlob(doc);
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Plano_' + (prof || 'Plano').replace(/[^a-zA-Z0-9]/g,'_') + '.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    st.textContent = '✅ Documento .docx exportado com sucesso!';
    setTimeout(() => st.textContent = '', 5000);
  } catch(err){
    console.error(err);
    st.className = 'status-msg err';
    st.textContent = 'Erro: ' + (err.message || err);
  }
  btn.disabled = false;
}

// ===== RESTANTE DO CÓDIGO (salvarPlano, IA functions, admin, etc.) =====
// Cole aqui todas as outras funções do seu arquivo original (tentarLogin, adminSalvarChave, analisarIA, sugerirConteudo, etc.)

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('loginOverlay').classList.add('open');
  document.getElementById('loginInput').focus();
  filterSkills();
});
