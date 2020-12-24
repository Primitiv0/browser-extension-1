import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: 'https://05d5ab6a0ad24533905722b6bdd6b70c@o309837.ingest.sentry.io/5576182',
  tracesSampleRate: 1.0,
});

function copy() {
  const copyText = document.querySelector("input");
  copyText.select();
  document.execCommand("copy");
}

function storageGet(key) {
  return new Promise(r => {
    chrome.storage.sync.get([key], function(result) {
      r(result[key]);
    });
  })
}

function storageSet(key, value) {
  return new Promise(r => {
    chrome.storage.sync.set({[key]: value}, r);
  });
}

async function selectDomain(e) {
  await storageSet("selectedDomain", e.target.value);
  location.reload()
}

function getCookies(domain, name) {
  return new Promise(r => {
    chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
      r(cookie.value);
    });
  })
}

async function getUserDomains(token) {
  const res = await fetch(
    "https://apiv1.mailway.app/user/domains",
    {
      method: "get",
      headers: {
        Authorization: "Bearer " + token,
      }
    }
  );
  const {data, ok} = await res.json();
  if (!ok) {
    window.open("https://dash.mailway.app/login");
    return [];
  } else {
    return data;
  }
}

async function generateTemoraryAddress(token, selectedDomain) {
  const res = await fetch(
    "https://apiv1.mailway.app/domain/"+selectedDomain+"/temporary-address",
    {
      method: "post",
      headers: {
        Authorization: "Bearer " + token,
      }
    }
  );

  const {data, ok} = await res.json();
  if (!ok) {
    window.open("https://dash.mailway.app/login");
    return "";
  } else {
    return data.address;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const app = document.getElementById("app");

    const token = await getCookies("https://dash.mailway.app", "u");
    if (!token) {
      window.open("https://dash.mailway.app/login");
      return;
    }

    const selectedDomain = await storageGet("selectedDomain");
    if (!selectedDomain) {
      const domains = await getUserDomains(token);

      const select = document.createElement("select");

      const defaultOption = document.createElement("option");
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.text = "example.com";
      select.appendChild(defaultOption);

      for (let i = 0, len = domains.length; i < len; i++) {
        const option = document.createElement("option");
        option.text = domains[i];
        option.value = domains[i];
        select.appendChild(option);
      }

      app.innerHTML = "Select a domain to generate emails with:<br />"
      app.appendChild(select);
      select.onchange = selectDomain;
      return;
    }
    console.log({selectedDomain});

    const generate = document.createElement("button");
    generate.id = "generate";
    generate.innerText = "Generate temporary address";
    app.innerHTML = "";
    app.appendChild(generate);

    generate.addEventListener(
      "click",
      async (e) => {
        e.target.innerText = "Generating...";
        const address = await generateTemoraryAddress(token, selectedDomain);
        app.innerHTML = `Copied in your clipboard: <br /><input value=${address} />`;
        copy();
      },
          false
      );

    const reset = document.createElement("a");
    reset.id = "reset";
    reset.innerText = "Using "+ selectedDomain +", click here to reset.";
    app.appendChild(reset);
    reset.onclick = async  () => {
      chrome.storage.sync.clear(() => {
        console.log("cleared")
        location.reload()
      });
    }
  },
  false
);
