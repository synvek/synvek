import React from 'react';
import { Button, Card, Space, Typography, Divider } from 'antd';
import { EnhancedIcon } from './EnhancedIcon';
import { BackgroundEnhancement, GradientBackground, TextureBackground } from './BackgroundEnhancement';
import { IconName, IconSize, iconSizes } from './IconUtils';
import { designTokens } from '../../../styles/design-tokens';

const { Title, Text } = Typography;

// Demo component showcasing the enhanced icon system
export const IconSystemDemo: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [selectedIcon, setSelectedIcon] = React.useState<IconName>('chat');
  
  const iconNames: IconName[] = ['chat', 'image', 'settings', 'help', 'copy', 'download'];
  const iconSizeKeys = Object.keys(iconSizes) as IconSize[];
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <BackgroundEnhancement
        type="gradient"
        intensity="subtle"
        theme={theme}
        style={{ padding: '24px', borderRadius: '12px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>Enhanced Icon System Demo</Title>
            <Text>Showcasing consistent icon sizing, interactive states, and background enhancements</Text>
            <div style={{ marginTop: '16px' }}>
              <Button onClick={toggleTheme}>
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
              </Button>
            </div>
          </div>
          
          <Divider />
          
          {/* Icon Sizes Demo */}
          <Card title="Icon Sizes" style={{ marginBottom: '24px' }}>
            <Space wrap>
              {iconSizeKeys.map(size => (
                <div key={size} style={{ textAlign: 'center', margin: '8px' }}>
                  <EnhancedIcon
                    name="settings"
                    size={size}
                    theme={theme}
                    interactive
                  />
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    {size} ({iconSizes[size]})
                  </div>
                </div>
              ))}
            </Space>
          </Card>
          
          {/* Interactive States Demo */}
          <Card title="Interactive States" style={{ marginBottom: '24px' }}>
            <Space wrap>
              {(['default', 'hover', 'active', 'disabled', 'focus'] as const).map(state => (
                <div key={state} style={{ textAlign: 'center', margin: '8px' }}>
                  <EnhancedIcon
                    name="chat"
                    size="lg"
                    theme={theme}
                    interactive
                    state={state}
                  />
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    {state}
                  </div>
                </div>
              ))}
            </Space>
          </Card>
          
          {/* Icon Collection Demo */}
          <Card title="Icon Collection" style={{ marginBottom: '24px' }}>
            <Space wrap>
              {iconNames.map(iconName => (
                <Button
                  key={iconName}
                  type={selectedIcon === iconName ? 'primary' : 'default'}
                  onClick={() => setSelectedIcon(iconName)}
                  style={{ margin: '4px' }}
                >
                  <EnhancedIcon
                    name={iconName}
                    size="sm"
                    theme={theme}
                    interactive
                  />
                  {iconName}
                </Button>
              ))}
            </Space>
          </Card>
          
          {/* Background Enhancements Demo */}
          <Card title="Background Enhancements" style={{ marginBottom: '24px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              
              {/* Gradient Backgrounds */}
              <div>
                <Title level={4}>Gradient Backgrounds</Title>
                <Space wrap>
                  {(['subtle', 'medium', 'strong'] as const).map(intensity => (
                    <GradientBackground
                      key={intensity}
                      intensity={intensity}
                      theme={theme}
                      style={{ 
                        padding: '16px', 
                        margin: '8px',
                        minWidth: '120px',
                        textAlign: 'center',
                        color: designTokens.colors[theme].text.primary
                      }}
                    >
                      <EnhancedIcon
                        name="image"
                        size="lg"
                        theme={theme}
                        interactive
                      />
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        {intensity}
                      </div>
                    </GradientBackground>
                  ))}
                </Space>
              </div>
              
              {/* Texture Backgrounds */}
              <div>
                <Title level={4}>Texture Backgrounds</Title>
                <Space wrap>
                  {(['subtle', 'medium'] as const).map(intensity => (
                    <TextureBackground
                      key={intensity}
                      intensity={intensity}
                      theme={theme}
                      style={{ 
                        padding: '16px', 
                        margin: '8px',
                        minWidth: '120px',
                        textAlign: 'center',
                        color: designTokens.colors[theme].text.primary
                      }}
                    >
                      <EnhancedIcon
                        name="settings"
                        size="lg"
                        theme={theme}
                        interactive
                      />
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        {intensity}
                      </div>
                    </TextureBackground>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
          
          {/* Interactive Icon Playground */}
          <Card title="Interactive Icon Playground">
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <BackgroundEnhancement
                type="gradient"
                intensity="medium"
                theme={theme}
                style={{ 
                  padding: '32px', 
                  borderRadius: '16px',
                  display: 'inline-block'
                }}
              >
                <EnhancedIcon
                  name={selectedIcon}
                  size="2xl"
                  theme={theme}
                  interactive
                  onClick={() => console.log(`Clicked ${selectedIcon} icon`)}
                  aria-label={`${selectedIcon} icon button`}
                />
              </BackgroundEnhancement>
              <div style={{ marginTop: '16px' }}>
                <Text>Click the icon above or select different icons from the collection</Text>
              </div>
            </div>
          </Card>
          
          {/* Technical Details */}
          <Card title="Technical Features">
            <Space direction="vertical" size="small">
              <Text>✅ Consistent icon sizing following 4px grid system</Text>
              <Text>✅ Interactive state colors with smooth transitions</Text>
              <Text>✅ Accessibility compliance with proper ARIA labels</Text>
              <Text>✅ Touch target sizing (minimum 44x44px)</Text>
              <Text>✅ Background enhancements with gradients and textures</Text>
              <Text>✅ Theme-aware color variations</Text>
              <Text>✅ Hover animations and visual feedback</Text>
              <Text>✅ Property-based testing for consistency</Text>
            </Space>
          </Card>
        </Space>
      </BackgroundEnhancement>
    </div>
  );
};

export default IconSystemDemo;