import React, { useEffect, useState } from "react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Layout,
  Row,
  Col,
  Button,
  Typography,
  message as antdMessage,
  Space,
  Card,
  Modal,
  Statistic,
  Progress,
  Divider,
} from "antd";
import { Network, Provider } from "aptos";
import {
  RocketOutlined,
  TrophyOutlined,
  HistoryOutlined,
  UserOutlined,
  RobotOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

const provider = new Provider(Network.DEVNET);
const moduleAddress =
  "0x19648f869201507ccd15e4dc3b900f730ba44c19811d0bbb1dd72bd0f1cc5c4d";

interface GameState {
  playerScore: number;
  aiScore: number;
  gamesPlayed: number;
  draws: number;
  lastResult: number;
  playerLastMove: number;
  aiLastMove: number;
}

interface GameHistoryItem {
  playerMove: string;
  aiMove: string;
  result: string;
}

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    playerMove: string;
    aiMove: string;
    result: string;
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);

  const moves = ["Rock", "Paper", "Scissors"];
  const results = ["Player Wins", "AI Wins", "Tie"];

  const fetchGameState = async () => {
    if (!account) return;
    try {
      const resource = await provider.getAccountResource(
        account.address,
        `${moduleAddress}::rock_paper_scissors::GameState`
      );
      const state = resource.data as any;
      setGameState({
        playerScore: Number(state.player_wins),
        aiScore: Number(state.ai_wins),
        gamesPlayed: Number(state.games_played),
        draws: Number(state.draws),
        lastResult: Number(state.last_game_result.result),
        playerLastMove: Number(state.last_game_result.player_choice),
        aiLastMove: Number(state.last_game_result.ai_choice),
      });
      setGameInitialized(true);
    } catch (e) {
      console.error("Error fetching game state:", e);
      setGameInitialized(false);
    }
  };

  const initializeGame = async () => {
    if (!account) return;
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::rock_paper_scissors::initialize_game`,
        type_arguments: [],
        arguments: [],
      };
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      await fetchGameState();
      antdMessage.success("Game initialized successfully!");
      setGameInitialized(true);
    } catch (error) {
      console.error("Error initializing game:", error);
      antdMessage.error("Failed to initialize game");
    }
  };

  const playGame = async (moveIndex: number) => {
    if (!account) return;
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::rock_paper_scissors::play_game`,
        type_arguments: [],
        arguments: [moveIndex],
      };
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      await fetchGameState();

      if (gameState) {
        const playerMove = moves[moveIndex];
        const aiMove = moves[gameState.aiLastMove];
        const result = results[gameState.lastResult];
        setModalContent({ playerMove, aiMove, result });
        setIsModalVisible(true);

        setGameHistory((prevHistory) => [
          { playerMove, aiMove, result },
          ...prevHistory.slice(0, 4),
        ]);
      }

      antdMessage.success("Move submitted successfully!");
    } catch (error) {
      console.error("Error playing game:", error);
      antdMessage.error("Failed to submit move");
    }
  };

  const calculateWinPercentage = (wins: number, total: number): string => {
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  };

  useEffect(() => {
    if (account) {
      fetchGameState();
    } else {
      setGameInitialized(false);
      setGameState(null);
    }
  }, [account]);

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80') no-repeat center center fixed",
        backgroundSize: "cover",
      }}
    >
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          <RocketOutlined /> Cosmic Rock Paper Scissors
        </Title>
        <WalletSelector />
      </Header>
      <Layout>
        <Sider
          width={300}
          style={{ background: "rgba(0, 33, 64, 0.75)", padding: "20px" }}
        >
          {gameState && (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card
                style={{
                  background: "rgba(0, 58, 140, 0.75)",
                  borderRadius: "10px",
                }}
              >
                <Statistic
                  title={<span style={{ color: "#fff" }}>Player Score</span>}
                  value={gameState.playerScore}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
              <Card
                style={{
                  background: "rgba(0, 58, 140, 0.75)",
                  borderRadius: "10px",
                }}
              >
                <Statistic
                  title={<span style={{ color: "#fff" }}>AI Score</span>}
                  value={gameState.aiScore}
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
              <Card
                style={{
                  background: "rgba(0, 58, 140, 0.75)",
                  borderRadius: "10px",
                }}
              >
                <Statistic
                  title={<span style={{ color: "#fff" }}>Draws</span>}
                  value={gameState.draws}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
              <Card
                style={{
                  background: "rgba(0, 58, 140, 0.75)",
                  borderRadius: "10px",
                }}
              >
                <Statistic
                  title={<span style={{ color: "#fff" }}>Games Played</span>}
                  value={gameState.gamesPlayed}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
              <Progress
                percent={Number(
                  calculateWinPercentage(
                    gameState.playerScore,
                    gameState.gamesPlayed
                  )
                )}
                status="active"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
              <div
                style={{ color: "#fff", textAlign: "center", marginTop: "10px" }}
              >
                Win Rate:{" "}
                {calculateWinPercentage(
                  gameState.playerScore,
                  gameState.gamesPlayed
                )}
                %
              </div>
            </Space>
          )}
        </Sider>

        <Content
          style={{ padding: "20px", background: "rgba(0, 21, 41, 0.75)" }}
        >
          <Card
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "15px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {!account ? (
              <Text style={{ color: "#fff", fontSize: "18px" }}>
                Please connect your wallet to play.
              </Text>
            ) : !gameInitialized ? (
              <Button
                onClick={initializeGame}
                type="primary"
                size="large"
                style={{ width: "100%" }}
              >
                Initialize Game
              </Button>
            ) : (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Title
                  level={3}
                  style={{ color: "#fff", textAlign: "center", margin: 0 }}
                >
                  Choose your move:
                </Title>
                <Row justify="center" gutter={[16, 16]}>
                  {moves.map((move, index) => (
                    <Col key={move}>
                      <Button
                        onClick={() => playGame(index)}
                        type="primary"
                        size="large"
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "60px",
                          fontSize: "18px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          background: `linear-gradient(145deg, #00a8ff, #0097e6)`,
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {move}
                      </Button>
                    </Col>
                  ))}
                </Row>
                {gameState && gameState.gamesPlayed > 0 && (
                  <>
                    <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: "18px",
                        textAlign: "center",
                      }}
                    >
                      Last Result: {results[gameState.lastResult] || "N/A"}
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: "18px",
                        textAlign: "center",
                      }}
                    >
                      Your Last Move:{" "}
                      {moves[gameState.playerLastMove] || "N/A"}
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: "18px",
                        textAlign: "center",
                      }}
                    >
                      AI's Last Move: {moves[gameState.aiLastMove] || "N/A"}
                    </Text>
                  </>
                )}
                <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                <Title level={4} style={{ color: "#fff", textAlign: "center" }}>
                  <HistoryOutlined /> Recent Games:
                </Title>
                {gameHistory.map((game, index) => (
                  <Text
                    key={index}
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    You: {game.playerMove} | AI: {game.aiMove} | Result:{" "}
                    {game.result}
                  </Text>
                ))}
              </Space>
            )}
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Game Result"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setIsModalVisible(false)}
          >
            OK
          </Button>,
        ]}
        bodyStyle={{ background: "rgba(0, 33, 64, 0.75)", color: "#fff" }}
        centered
      >
        {modalContent && (
          <>
            <p>Your Move: {modalContent.playerMove}</p>
            <p>AI's Move: {modalContent.aiMove}</p>
            <p>Result: {modalContent.result}</p>
          </>
        )}
      </Modal>
    </Layout>
  );
}

export default App;