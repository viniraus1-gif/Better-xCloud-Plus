# Better xCloud Plus Android (beta)

Wrapper Android em tela cheia para `xbox.com/play`. O app injeta a versão compilada do Better xCloud Plus no início de documentos Xbox compatíveis; não baixa jogos e não substitui o serviço oficial.

## Abrir e gerar o APK

1. Instale o Android Studio com o Android SDK Platform 35 e JDK 17.
2. Abra **esta pasta** (`mobile-android`) no Android Studio.
3. Aguarde a sincronização do Gradle e conecte um celular Android ou abra um emulador.
4. Use **Run** para testar. Para gerar um APK: **Build → Build APK(s)**.

O arquivo de script em `app/src/main/assets/better-xcloud-plus.user.js` precisa ser atualizado sempre que a versão em `../dist/` mudar.

## Limites

- Requer Android System WebView atualizado e acesso ao Xbox Cloud Gaming.
- A injeção antecipada usa a API oficial `WebViewCompat.addDocumentStartJavaScript` quando disponível; em WebViews antigos há um fallback que pode ser menos compatível.
- É um projeto independente, experimental e não afiliado à Microsoft ou Xbox.
