# Better xCloud Plus Android (beta)

Wrapper Android em tela cheia para `xbox.com/play`. O app injeta a versão compilada do Better xCloud Plus no início de documentos Xbox compatíveis; não baixa jogos e não substitui o serviço oficial.

## Abrir e gerar o APK

1. Instale o Android Studio com o Android SDK Platform 35 e JDK 17.
2. Abra **esta pasta** (`mobile-android`) no Android Studio.
3. Aguarde a sincronização do Gradle e conecte um celular Android ou abra um emulador.
4. Use **Run** para testar. Para gerar um APK: **Build → Build APK(s)**.

O app usa o arquivo exclusivo `app/src/main/assets/better-xcloud-plus.android.user.js`.
Ele é gerado automaticamente junto com a build Android pelo comando abaixo, sem reutilizar
o bundle de PC:

```bash
bun build.ts --version 1.0.0 --variant full --pretty
```

O bundle do PC continua em `../dist/better-xcloud-plus.pretty.user.js`; o bundle Android
correspondente fica em `../dist/better-xcloud-plus.android-app.pretty.user.js`.

## Limites

- Requer Android System WebView atualizado e acesso ao Xbox Cloud Gaming.
- A injeção antecipada usa a API oficial `WebViewCompat.addDocumentStartJavaScript` quando disponível; em WebViews antigos há um fallback que pode ser menos compatível.
- É um projeto independente, experimental e não afiliado à Microsoft ou Xbox.
