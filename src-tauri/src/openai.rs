use std::collections::HashMap;
use std::io::{stdout, Write};
use std::sync::{Arc, Mutex};

use lazy_static::lazy_static;
use openai::chat::{ChatCompletion, ChatCompletionDelta, ChatCompletionMessage, ChatCompletionMessageRole};
use openai::set_key;
use tokio::sync::mpsc::Receiver;

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct PromptConfig {
    pub prompts: Vec<Prompt>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct Prompt {
    pub title: String,
    pub prompt: String,
}

lazy_static! {
    static ref PROGRESS: Arc<Mutex<HashMap<String, String>>> = Arc::new(Mutex::new(HashMap::new()));
}

pub fn get_initial_prompts() -> Vec<Prompt> {
    return vec![
        Prompt {
            title: String::from("Generate a title"),
            prompt: String::from("Here's a Markdown memo. Could you generate a better title for it? Output should be Japanese.Don't quote result."),
        },
        Prompt {
            title: String::from("Write the continuation"),
            prompt: String::from("Here's a Markdown memo. Could you write the continuation of it? Output should be in Japanese."),
        },
        Prompt {
            title: String::from("Complete it"),
            prompt: String::from("Here's a Markdown memo. Could you complete it? Output should be in Japanese."),
        },
    ];
}

pub fn get_openai_progress(uuid: String) -> Option<String> {
    // uuid をキーにしてグローバル変数から進捗を取得する。
    PROGRESS.lock().unwrap().get(&uuid).cloned()
}

// save the current state by 'uuid' as key.
pub(crate) async fn ask_openai(uuid: String, openai_token: String, prompt: String, note: String) -> anyhow::Result<String> {
    log::info!("ask_openai: {:?}", prompt.clone());

    set_key(openai_token.clone());

    let messages = vec![
        ChatCompletionMessage {
            role: ChatCompletionMessageRole::System,
            content: Some(prompt.clone()),
            name: Some(String::from("Prompt")),
            function_call: None,
        },
        ChatCompletionMessage {
            role: ChatCompletionMessageRole::User,
            content: Some(note),
            name: Some(String::from("Note")),
            function_call: None,
        }
    ];
    let chat_stream = ChatCompletionDelta::builder("gpt-4", messages.clone())
        .create_stream()
        .await?;
    let chat_completion: ChatCompletion = listen_for_tokens(uuid, chat_stream).await;

    let returned_message = chat_completion.choices
        .first()
        .unwrap().message.clone();

    log::info!(
        "{:#?}: {}",
        &returned_message.role,
        &returned_message.content.clone().unwrap().trim()
    );
    Ok(returned_message.content.clone().unwrap().trim().parse()?)
}

async fn listen_for_tokens(uuid: String, mut chat_stream: Receiver<ChatCompletionDelta>) -> ChatCompletion {
    let mut merged: Option<ChatCompletionDelta> = None;
    let mut content_buffer = String::new();
    while let Some(delta) = chat_stream.recv().await {
        let choice = &delta.choices[0];
        if let Some(role) = &choice.delta.role {
            print!("{:#?}: ", role);
        }
        if let Some(content) = &choice.delta.content {
            print!("{}", content);
            content_buffer.push_str(content);
            PROGRESS.lock().unwrap().insert(uuid.clone(), content_buffer.clone());
        }
        if choice.finish_reason.is_some() {
            // The message being streamed has been fully received.
            println!();
        }
        stdout().flush().unwrap();

        // Merge completion into accrued.
        match merged.as_mut() {
            Some(c) => {
                c.merge(delta).unwrap();
            }
            None => merged = Some(delta),
        };
    }
    merged.unwrap().into()
}
