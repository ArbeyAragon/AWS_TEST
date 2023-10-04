let generalData = [];
let data = [];
let correctAnswers = 0;
let incorrectAnswers = 0;
let currentIndex = 0;
let questionBuffer = [];
let totalCorrectAnswersInTable = 0;
let level = 1;

//otiene la url actual de la pagina
const url = window.location.href+"/archivo.csv";

function cleanText(text) {
  return text.trim().replace(/"/g, "");
}

function fetchCSV(url) {
  return fetch(url)
    .then((response) => response.text())
    .then((csv) => {
      let lines = csv
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
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

fetchCSV(url).then(() => {
  console.log("Datos cargados exitosamente");
});

function getNextQuestions() {
  let questions = [];
  for (let i = 0; i < 3; i++) {
    if (currentIndex >= generalData.length) {
      currentIndex = 0;
    }
    let question = {...generalData[currentIndex], answeredCorrectly: 0};  // Initialization
    questions.push(question);
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
      isCorrect: question[`Correcta ${i}`].toLowerCase() === "true",
    });
  }
  options.sort(() => Math.random() - 0.5);
  for (let i = 1; i <= 5; i++) {
    question[`Opción ${i}`] = options[i - 1].text;
    question[`Correcta ${i}`] = options[i - 1].isCorrect ? "true" : "false";
  }
}
function answerClicked(questionIndex, optionIndex) {
  let isCorrect =
    data[questionIndex][`Correcta ${optionIndex + 1}`].toLowerCase() === "true";
  let tableRow = document
    .getElementById("table2")
    .getElementsByTagName("tbody")[0].rows[questionIndex];
  let btn = tableRow.cells[optionIndex + 1].firstChild;

  if (isCorrect) {
    correctAnswers++;
    data[questionIndex].answeredCorrectly++;
    btn.style.backgroundColor = "green";

    // Leer en voz alta la respuesta correcta
    let utterance = new SpeechSynthesisUtterance(btn.textContent);
    utterance.lang = "es-ES";
    window.speechSynthesis.speak(utterance);

    try {
      document.getElementById("correctSound").play();
    } catch (error) {
      console.log(error);
    }
    
    console.log(totalCorrectAnswersForQuestion(data[questionIndex]));
    console.log(data[questionIndex].answeredCorrectly);
    console.log(data[questionIndex]);
    if (data[questionIndex].answeredCorrectly === totalCorrectAnswersForQuestion(data[questionIndex])) {
        removeQuestionFromTable2(questionIndex);
    }
  } else {
    incorrectAnswers++;
    btn.style.backgroundColor = "red";

    try {
      document.getElementById("incorrectSound").play();
    } catch (error) {
      console.log(error);
    }

    resetRound();
    return;
  }

  updateCounters();

  if (correctAnswers === totalCorrectAnswersInTable) {
    // Proceder al siguiente conjunto de preguntas
    level++;
    //
    document.getElementById("levelCount").textContent = level;
    startCountdown();
  }
}

// Función para resetear la ronda sin cambiar el buffer
function resetRound() {
  updateCounters();
  data = questionBuffer;
  showFirstTable();
  setTimeout(() => {
    correctAnswers = 0;
    incorrectAnswers = 0;
    updateCounters();
    data = shuffleBuffer();
    data.forEach((item) => {
      item.answeredCorrectly = 0; 
    });
    showSecondTable();
  }, 10000); // Tiempo de espera antes de mostrar la tabla nuevamente
}
function startCountdown() {
  updateQuestionBuffer();
  data = questionBuffer;
  showFirstTable();
  data = shuffleBuffer();
  for (let question of data) {
    shuffleAnswers(question);
  }

  let countdownValue = 15;
  const countdownElement = document.getElementById("countdown");
  countdownElement.textContent = countdownValue;

  const intervalId = setInterval(() => {
    countdownValue--;
    countdownElement.textContent = countdownValue;

    if (countdownValue === 0) {
      clearInterval(intervalId);
      correctAnswers = 0;
      incorrectAnswers = 0;
      updateCounters();
      data = shuffleBuffer();
      data.forEach((item) => {
        item.answeredCorrectly = 0; 
      });
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
    for (let i = 1; i <= 5; i++) {
      // Cambia el 4 por 5
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

    // Columna para la pregunta y botón de leer
    let questionCell = row.insertCell(0);
    questionCell.textContent = item.Pregunta;

    // Agregar un botón para leer la pregunta
    let readButton = document.createElement("button");
    readButton.textContent = "Leer";
    readButton.onclick = () => {
      let utterance = new SpeechSynthesisUtterance(item.Pregunta);
      utterance.lang = "es-ES";
      window.speechSynthesis.speak(utterance);
    };
    questionCell.appendChild(readButton);

    for (let i = 1; i <= 5; i++) {
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
  console.log("Total: ", totalCorrectAnswersInTable);
  console.log("Correctas: ", correctAnswers);
  console.log("Incorrectas: ", incorrectAnswers);
  console.log("Netas: ", correctAnswers - incorrectAnswers);
  document.getElementById("correctCount").textContent = correctAnswers;
  document.getElementById("incorrectCount").textContent = incorrectAnswers;
  document.getElementById("netCount").textContent =
    correctAnswers - incorrectAnswers;
}

function totalCorrectAnswersForQuestion(question) {
  let count = 0;
  for (let i = 1; i <= 5; i++) {
      if (question[`Correcta ${i}`].toLowerCase() === "true") {
          count++;
      }
  }
  return count;
}

function removeQuestionFromTable2(questionIndex) {
  const table = document.getElementById("table2").getElementsByTagName("tbody")[0];
  let row = table.rows[questionIndex];
  
  // Disable all buttons in the row and change its color
  for (let i = 0; i < row.cells.length; i++) {
    let cell = row.cells[i];
    let btn = cell.firstChild;
    if (btn && btn.tagName === "BUTTON") {
      btn.disabled = true;
    }
  }
  row.style.backgroundColor = "#d3d3d3";  // Grey color
  
  // If you still want to remove the question from the data array (but not the table)
  // data.splice(questionIndex, 1);
}
