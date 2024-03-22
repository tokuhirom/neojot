use openai_api_rs::v1::api::Client;
use openai_api_rs::v1::chat_completion;
use openai_api_rs::v1::chat_completion::ChatCompletionRequest;
use openai_api_rs::v1::common::GPT4;

pub(crate) fn ask_openai(openai_token: String, prompt: String, note: String) -> anyhow::Result<()> {
    let client = Client::new(openai_token);
    let req = ChatCompletionRequest::new(
        GPT4.to_string(),
        vec![
            chat_completion::ChatCompletionMessage {
                role: chat_completion::MessageRole::system,
                content: chat_completion::Content::Text(prompt),
                name: Some(String::from("Prompt")),
            },
            chat_completion::ChatCompletionMessage {
                role: chat_completion::MessageRole::system,
                content: chat_completion::Content::Text(note),
                name: Some(String::from("Note")),
            }
        ],
    );
    let result = client.chat_completion(req)?;
    println!("{:?}", result.choices[0].message.content);
    Ok(())
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

