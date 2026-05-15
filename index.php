<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrada - Jardim de Sentimentos</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <main class="login-shell">
        <h1>Bem-vindo ao Jardim</h1>
        <p class="description">Digite seu nome e uma frase para iniciar sua plantação de sentimentos. No próximo passo, escolha um lugar no mapa e desenhe o que existe dentro do seu coração.</p>
        <form action="garden.php" method="post" onsubmit="return validateName()">
            <div class="form-group">
                <input type="text" id="username" name="username" maxlength="30" required placeholder="Seu nome" autocomplete="name">
                <textarea id="phrase" name="phrase" rows="4" maxlength="250" required placeholder="Escreva uma frase bonita para seu jardim"></textarea>
                <button type="submit">Entrar no Jardim</button>
            </div>
        </form>
        <footer class="note">Seu nome será usado para plantar uma nova flor e fazer o jardim crescer. <a href="logout.php">Sair e começar de novo</a></footer>
    </main>
    <script>
        function validateName() {
            const nameInput = document.getElementById('username');
            const phraseInput = document.getElementById('phrase');
            if (!nameInput.value.trim()) {
                alert('Por favor, digite seu nome para continuar.');
                nameInput.focus();
                return false;
            }
            if (!phraseInput.value.trim()) {
                alert('Por favor, escreva uma frase antes de entrar no jardim.');
                phraseInput.focus();
                return false;
            }
            return true;
        }
    </script>
</body>
</html>