<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrada - Jardim de Sentimentos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <main class="login-shell">
        <h1>Bem-vindo ao Jardim</h1>
        <p class="description">Digite seu nome e uma frase para iniciar sua plantação de sentimentos. No próximo passo, escolha um lugar no mapa e desenhe o que existe dentro do seu coração.</p>
        <p id="form-error" class="form-error hidden" role="alert"></p>
        <form action="garden.php" method="post" novalidate>
            <div class="form-group">
                <input type="text" id="username" name="username" maxlength="30" required placeholder="Seu nome" autocomplete="name" aria-describedby="form-error">
                <textarea id="phrase" name="phrase" rows="4" maxlength="250" required placeholder="Escreva uma frase bonita para seu jardim" aria-describedby="form-error"></textarea>
                <button type="submit">Entrar no Jardim</button>
            </div>
        </form>
        <footer class="note">Seu nome será usado para plantar uma nova flor e fazer o jardim crescer. <a href="logout.php">Sair e começar de novo</a></footer>
    </main>
    <script>
        const form = document.querySelector('form');
        const formError = document.getElementById('form-error');
        const nameInput = document.getElementById('username');
        const phraseInput = document.getElementById('phrase');

        function showFormError(message) {
            formError.textContent = message;
            formError.classList.remove('hidden');
        }

        function clearFormError() {
            formError.textContent = '';
            formError.classList.add('hidden');
        }

        form.addEventListener('submit', (event) => {
            clearFormError();
            if (!nameInput.value.trim()) {
                event.preventDefault();
                showFormError('Por favor, digite seu nome para continuar.');
                nameInput.focus();
                return;
            }
            if (!phraseInput.value.trim()) {
                event.preventDefault();
                showFormError('Por favor, escreva uma frase antes de entrar no jardim.');
                phraseInput.focus();
            }
        });

        [nameInput, phraseInput].forEach((field) => {
            field.addEventListener('input', clearFormError);
        });
    </script>
</body>
</html>
