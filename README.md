<p align="center">
  <img src="resources/logos/better-xcloud-plus.png" alt="Better xCloud Plus" width="320">
</p>

<h1 align="center">Better xCloud Plus</h1>

<p align="center">
  Uma versão expandida do Better xCloud, focada em <b>qualidade de imagem, personalização, desempenho e controle da experiência do Xbox Cloud Gaming.</b>
</p>

<p align="center">
  🎮 Cloud Gaming &nbsp;•&nbsp; 🖥️ Upscaling &nbsp;•&nbsp; ⚡ Performance &nbsp;•&nbsp; 🎨 Personalização
</p>

> [!WARNING]
> **Projeto em beta.**
>
> O Better xCloud Plus ainda está em desenvolvimento. Bugs, recursos experimentais, alterações frequentes e incompatibilidades temporárias podem ocorrer, especialmente após atualizações do site do Xbox.
>
> Mantenha o script atualizado para receber correções e melhorias.

## 🚀 O que é o Better xCloud Plus?

O **Better xCloud Plus** é um projeto brasileiro baseado no [Better xCloud](https://github.com/redphx/better-xcloud), criado para expandir as possibilidades de personalização do **Xbox Cloud Gaming** diretamente no navegador.

O projeto adiciona controles avançados de imagem, processamento visual local, personalização da interface, informações do stream e diferentes ajustes de desempenho.

A proposta é simples: **dar ao usuário mais controle sobre como o xCloud aparece e funciona em seu dispositivo**, respeitando as limitações do streaming e dos servidores da Microsoft.

---

## ✨ Principais recursos

### 🖥️ Processamento de imagem

Melhore a apresentação do stream diretamente no seu dispositivo com diferentes opções de processamento visual.

- Upscaling local da imagem
- **AMD FidelityFX Super Resolution 1 (FSR 1)**
- **NVIDIA Image Scaling (NIS)**
- Modos de processamento **VX**
- Nitidez adaptativa
- Redução experimental de artefatos
- Reconstrução de detalhes
- Reconstrução temporal experimental
- Ajustes para diferentes GPUs e telas

> O processamento é realizado localmente no navegador e não altera a resolução enviada pelos servidores do Xbox.

### 🎨 Interface personalizada

Personalize a aparência do Xbox Cloud Gaming.

- Tamanho dos cards dos jogos
- Bordas personalizadas
- Animações
- Efeitos ao passar o mouse
- Transições ao iniciar jogos
- Ajustes visuais do hub
- Melhor qualidade para capas e fundos

Quando disponível nos servidores, as artes do site podem ser carregadas utilizando sua **qualidade original de até 100%**.

### ⚡ Perfis de desempenho

Escolha rapidamente entre diferentes configurações dependendo do seu dispositivo ou objetivo.

| Perfil | Recomendado para | Prioridade |
| --- | --- | --- |
| **Menor qualidade** | PCs modestos e dispositivos com pouca GPU | Menor processamento |
| **Padrão** | Uso diário | Equilíbrio entre qualidade e desempenho |
| **Maior qualidade** | GPU dedicada e telas maiores | Maior qualidade visual |
| **Competitivo VX** | Jogos rápidos e competitivos | Menor processamento visual adicional |

### 🎯 Modo competitivo

O **Modo Competitivo VX** reduz ou desativa temporariamente determinados efeitos visuais que adicionam processamento local.

A prioridade passa a ser:

- menor carga na GPU;
- menor processamento adicional;
- maior estabilidade;
- menor latência visual adicionada pelo próprio processamento.

### 📊 Informações do stream

Visualize informações úteis durante a sessão, incluindo:

- FPS;
- resolução de entrada;
- resolução de saída;
- estado do processamento visual;
- informações relacionadas aos filtros ativos.

### 🎮 Cloud Gaming + Reprodução Remota

O Better xCloud Plus foi desenvolvido para funcionar com:

- **Xbox Cloud Gaming**
- **Xbox Remote Play / Reprodução Remota**

Tudo integrado à experiência web do Xbox.

---

## ⚠️ Limitações importantes

O Better xCloud Plus funciona **no seu dispositivo depois que o vídeo é recebido do servidor**.

Por isso, existem algumas limitações importantes.

### Upscaling não é 4K nativo

O upscale pode melhorar a apresentação do vídeo em telas de maior resolução, mas **não transforma o stream original em um stream 4K nativo**.

A resolução e o bitrate enviados continuam dependendo da infraestrutura do Xbox Cloud Gaming.

### Qualidade das artes ≠ qualidade do stream

A configuração de qualidade de imagens afeta elementos da interface, como:

- capas;
- banners;
- fundos;
- artes dos jogos.

Ela **não altera diretamente a qualidade do vídeo transmitido durante o jogo**.

### Interpolação e geração de frames

Recursos experimentais relacionados à interpolação ou geração de frames dependem de fatores como:

- GPU;
- navegador;
- desempenho do dispositivo;
- jogo;
- taxa de atualização da tela.

Esses recursos podem aumentar a suavidade visual, mas **não reduzem a latência dos comandos enviada ao servidor**.

> Alguns desses recursos não estão disponíveis na versão Android.

### Resultados podem variar

A experiência depende de diversos fatores:

- GPU
- CPU
- monitor
- navegador
- sistema operacional
- qualidade da conexão
- latência da rede
- jogo utilizado

---

# 📦 Instalação

## Requisitos

| Necessário | Link |
| --- | --- |
| Navegador | [Microsoft Edge](https://www.microsoft.com/edge/download) · [Google Chrome](https://www.google.com/chrome/) · [Mozilla Firefox](https://www.mozilla.org/firefox/new/) |
| Gerenciador de userscripts | [Tampermonkey](https://www.tampermonkey.net/) |
| Better xCloud Plus | **[Instalar / Atualizar](https://raw.githubusercontent.com/viniraus1-gif/Better-xCloud-Plus/main/dist/better-xcloud-plus.pretty.user.js)** |
| Xbox Cloud Gaming | [Abrir xCloud](https://www.xbox.com/pt-BR/play) |
| Conta Microsoft | [Entrar ou criar conta](https://account.microsoft.com/) |

É necessária uma conta Microsoft e acesso a jogos compatíveis com o Xbox Cloud Gaming, seja por uma assinatura elegível ou por jogos que permitam transmissão pela sua própria biblioteca.

---

## 🔧 Como instalar

**1.** Instale um navegador compatível.

O **Microsoft Edge** é recomendado para testar todos os recursos disponíveis.

**2.** Instale o [Tampermonkey](https://www.tampermonkey.net/).

**3.** Abra:

### ➜ [Instalar Better xCloud Plus](https://raw.githubusercontent.com/viniraus1-gif/Better-xCloud-Plus/main/dist/better-xcloud-plus.pretty.user.js)

O Tampermonkey deverá detectar automaticamente o userscript.

**4.** Confirme a instalação.

**5.** Abra o [Xbox Cloud Gaming](https://www.xbox.com/pt-BR/play).

**6.** Entre em sua conta e inicie um jogo.

Os controles e menus adicionais do **Better xCloud Plus** estarão disponíveis através dos elementos adicionados pelo script.

---

## 🔄 Atualizações

Para atualizar manualmente, basta abrir novamente:

### ➜ [Atualizar Better xCloud Plus](https://raw.githubusercontent.com/viniraus1-gif/Better-xCloud-Plus/main/dist/better-xcloud-plus.pretty.user.js)

O Tampermonkey detectará a versão instalada e permitirá realizar a atualização.

É recomendado utilizar sempre a versão mais recente.

---

# 📱 Android — APK experimental

O projeto também possui uma versão experimental para Android localizada em:

[`mobile-android`](mobile-android)

Ela utiliza um **WebView em tela cheia** para abrir o Xbox Cloud Gaming e carregar a versão compilada do Better xCloud Plus.

> [!IMPORTANT]
> O aplicativo não é um cliente nativo do Xbox Cloud Gaming e não substitui uma conta Microsoft, assinatura ou acesso elegível aos jogos.

Devido às diferenças entre Android, WebView e navegadores desktop, **algumas funções disponíveis no PC podem estar desativadas ou indisponíveis no Android**.

---

# 🧪 Desenvolvimento

O projeto está em desenvolvimento ativo.

Para testar alterações no userscript é necessário:

- navegador compatível;
- Tampermonkey;
- acesso ao Xbox Cloud Gaming.

Como o site do Xbox pode receber alterações sem aviso, algumas funções podem precisar de ajustes após atualizações da plataforma.

---

# 🤝 Créditos

O **Better xCloud Plus** é baseado no projeto open source [Better xCloud](https://github.com/redphx/better-xcloud), desenvolvido por **redphx**.

Grande parte da base que torna este projeto possível vem do trabalho realizado no Better xCloud original.

Agradecimentos também aos projetos e tecnologias open source utilizados nos recursos de processamento e personalização visual.

---

## ⚖️ Aviso

Better xCloud Plus é um projeto independente e **não é afiliado, patrocinado ou endossado pela Microsoft ou Xbox**.

Xbox, Xbox Cloud Gaming e demais marcas relacionadas pertencem aos seus respectivos proprietários.
