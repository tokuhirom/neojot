use openai::chat::{ChatCompletion, ChatCompletionMessage, ChatCompletionMessageRole};
use openai::set_key;

pub(crate) async fn ask_openai(openai_token: String, prompt: String, note: String) -> anyhow::Result<String> {
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
    let chat_completion = ChatCompletion::builder("gpt-4", messages.clone())
        .create()
        .await?;

    let returned_message = chat_completion.choices.first().unwrap().message.clone();

    log::info!(
        "{:#?}: {}",
        &returned_message.role,
        &returned_message.content.clone().unwrap().trim()
    );
    Ok(returned_message.content.clone().unwrap().trim().parse()?)
}

#[cfg(test)]
mod tests {
    use std::env;

    use crate::openai::ask_openai;

    #[test]
    fn it_works() {
        let openai_token = env::var("OPENAI_API_KEY").unwrap().to_string();
        ask_openai(
            openai_token,
            "Here's a markdown notes.\nCould you recommend better title?".to_string(),
           "# hello\n\nBitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries. Transactions are verified by network nodes through cryptography and recorded in a public distributed ledger called a blockchain. Bitcoin was invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto. The currency began use in 2009 when its implementation was released as open-source software.".to_string()
        ).unwrap();
        // assert_eq!(ask_openai("# hello".to_string()), String::from("hello"));
    }
}

