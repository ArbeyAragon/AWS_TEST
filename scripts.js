let generalData = [];
let data = [];
let correctAnswers = 0;
let incorrectAnswers = 0;
let currentIndex = 0;
let questionBuffer = [];
let totalCorrectAnswersInTable = 0;

function cleanText(text) {
    return text.trim().replace(/"/g, "");
}

function fetchCSV(url) {
    return fetch(url)
        .then(response => response.text())
        .then(csv => {
            let lines = csv.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            let headers = lines[0].split(",").map(cleanText);
            let rows = [];

            for (let i = 1; i < lines.length; i++) {
                let obj = {};
                let currentLine = lines[i].split(",").map(cleanText);
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentLine[j];
                }
                rows.push(obj);
            }

            rows.sort(() => Math.random() - 0.5);
            generalData.push(...rows);
        });
}

fetchCSV("http://127.0.0.1:5500/archivo.csv").then(() => {
    console.log("Datos cargados exitosamente");
});

function getNextQuestions() {
    let questions = [];
    for (let i = 0; i < 3; i++) {
        if (currentIndex >= generalData.length) {
            currentIndex = 0;
        }
        questions.push(generalData[currentIndex]);
        currentIndex++;
    }
    return questions;
}

function updateQuestionBuffer() {
    if (questionBuffer.length === 12) {
        questionBuffer.splice(0, 3);
    }
    questionBuffer.push(...getNextQuestions());
}

function shuffleBuffer() {
    let shuffledBuffer = [...questionBuffer];
    shuffledBuffer.sort(() => Math.random() - 0.5);
    return shuffledBuffer;
}

function shuffleAnswers(question) {
    let options = [];
    for (let i = 1; i <= 5; i++) {
        options.push({
            text: question[`Opción ${i}`],
            isCorrect: question[`Correcta ${i}`].toLowerCase() === "true"
        });
    }
    options.sort(() => Math.random() - 0.5);
    for (let i = 1; i <= 5; i++) {
        question[`Opción ${i}`] = options[i-1].text;
        question[`Correcta ${i}`] = options[i-1].isCorrect ? "true" : "false";
    }
}
function answerClicked(questionIndex, optionIndex) {
    let isCorrect = data[questionIndex][`Correcta ${optionIndex + 1}`].toLowerCase() === "true";
    let tableRow = document.getElementById("table2").getElementsByTagName("tbody")[0].rows[questionIndex];
    let btn = tableRow.cells[optionIndex + 1].firstChild;
  
    if (isCorrect) {
        correctAnswers++;
        btn.style.backgroundColor = "green";
        document.getElementById("correctSound").play();
    } else {
        incorrectAnswers++;
        btn.style.backgroundColor = "red";
        document.getElementById("incorrectSound").play();
        
        // Si se responde incorrectamente, reinicia la ronda.
        startCountdown();
        return;
    }

    updateCounters();

    if (correctAnswers === totalCorrectAnswersInTable) {
        // Proceder al siguiente conjunto de preguntas
        startCountdown();
    }
}

function startCountdown() {
    updateQuestionBuffer();
    data = shuffleBuffer();
    
    for (let question of data) {
        shuffleAnswers(question);
    }
  
    showFirstTable();
  
    let countdownValue = 5;
    const countdownElement = document.getElementById("countdown");
    countdownElement.textContent = countdownValue;
  
    const intervalId = setInterval(() => {
        countdownValue--;
        countdownElement.textContent = countdownValue;
  
        if (countdownValue === 0) {
            clearInterval(intervalId);
            showSecondTable();
        }
    }, 1000);
}
function showFirstTable() {
    const table = document
      .getElementById("table1")
      .getElementsByTagName("tbody")[0];
    table.innerHTML = "";
    for (let item of data) {
      let row = table.insertRow();
      row.insertCell(0).textContent = item.Pregunta;
  
      // Detecta respuestas correctas
      let correctAnswers = [];
      for (let i = 1; i <= 5; i++) { // Cambia el 4 por 5
        if (item[`Correcta ${i}`] === "true") {
          correctAnswers.push(item[`Opción ${i}`]);
        }
      }
      row.insertCell(1).textContent = correctAnswers.join(", ");
    }
    document.getElementById("view1").style.display = "block";
    document.getElementById("view2").style.display = "none";
  }
  
  function showSecondTable() {
    const table = document
      .getElementById("table2")
      .getElementsByTagName("tbody")[0];
    table.innerHTML = "";
    totalCorrectAnswersInTable = 0;
  
    data.forEach((item, questionIndex) => {
      let row = table.insertRow();
      row.insertCell(0).textContent = item.Pregunta;
  
      for (let i = 1; i <= 5; i++) { // Cambia el 4 por 5
        if (item[`Correcta ${i}`].toLowerCase() === "true") {
          totalCorrectAnswersInTable++;
        }
        let cell = row.insertCell(i);
        let btn = document.createElement("button");
        btn.textContent = item[`Opción ${i}`];
        btn.onclick = () => answerClicked(questionIndex, i - 1);
        cell.appendChild(btn);
      }
    });
  
    document.getElementById("view2").style.display = "block";
    document.getElementById("view1").style.display = "none";
  }
  

function updateCounters() {
    document.getElementById("correctCount").textContent = correctAnswers;
    document.getElementById("incorrectCount").textContent = incorrectAnswers;
    document.getElementById("netCount").textContent = correctAnswers - incorrectAnswers;
}

